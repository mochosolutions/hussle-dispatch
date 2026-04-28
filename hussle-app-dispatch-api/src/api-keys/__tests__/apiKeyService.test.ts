import { ForbiddenError, NotFoundError } from '@/shared/errors/commonErrors';
import { createApiKeyService } from '../services/apiKeyService';
import type {
  ApiKeyRecord,
  ApiKeyRepoPort,
  ApiKeyVerifyLookup,
} from '../types/apiKeyTypes';

const ORG_ID = 'd73084dd-d6e7-4b79-af2b-63d17b4f4349';
const OTHER_ORG_ID = 'a1234567-89ab-cdef-0123-456789abcdef';
const KEY_ID = '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238';

const buildRecord = (overrides: Partial<ApiKeyRecord> = {}): ApiKeyRecord => ({
  id: KEY_ID,
  organizationId: ORG_ID,
  name: 'Test Key',
  keyPrefix: 'fc_live_xx',
  lastUsedAt: null,
  revokedAt: null,
  createdAt: new Date('2026-04-26T00:00:00.000Z'),
  updatedAt: new Date('2026-04-26T00:00:00.000Z'),
  ...overrides,
});

const buildLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

const buildRepo = (): jest.Mocked<ApiKeyRepoPort> => ({
  create: jest.fn(),
  findByPrefix: jest.fn(),
  findById: jest.fn(),
  listByOrg: jest.fn(),
  markRevoked: jest.fn(),
  touchLastUsed: jest.fn(),
});

describe('apiKeyService', () => {
  let repo: jest.Mocked<ApiKeyRepoPort>;
  let logger: ReturnType<typeof buildLogger>;
  let service: ReturnType<typeof createApiKeyService>;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = buildRepo();
    logger = buildLogger();
    service = createApiKeyService({ apiKeyRepo: repo, logger });
  });

  describe('generate', () => {
    it('returns key with fc_live_ prefix and length 32', async () => {
      // Arrange
      repo.create.mockResolvedValue(buildRecord());

      // Act
      const result = await service.generate({ organizationId: ORG_ID, name: 'Test' });

      // Assert
      expect(result.key.startsWith('fc_live_')).toBe(true);
      expect(result.key.length).toBe(32);
    });

    it('persists hash not plaintext key', async () => {
      // Arrange
      repo.create.mockResolvedValue(buildRecord());

      // Act
      const result = await service.generate({ organizationId: ORG_ID, name: 'Test' });

      // Assert
      expect(repo.create).toHaveBeenCalledTimes(1);
      const createArgs = repo.create.mock.calls[0]?.[0];
      expect(createArgs).toBeDefined();
      if (!createArgs) {
        throw new Error('Expected create args to be defined');
      }
      expect(createArgs.keyHash).not.toBe(result.key);
      expect(createArgs.keyHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('uses first 12 chars of key as keyPrefix', async () => {
      // Arrange
      repo.create.mockResolvedValue(buildRecord());

      // Act
      const result = await service.generate({ organizationId: ORG_ID, name: 'Test' });

      // Assert
      const createArgs = repo.create.mock.calls[0]?.[0];
      if (!createArgs) {
        throw new Error('Expected create args to be defined');
      }
      expect(createArgs.keyPrefix).toBe(result.key.slice(0, 12));
      expect(createArgs.keyPrefix.length).toBe(12);
    });
  });

  describe('verify', () => {
    const seedAcceptedKey = async (): Promise<{ key: string; hash: string }> => {
      repo.create.mockResolvedValue(buildRecord());
      const generated = await service.generate({ organizationId: ORG_ID, name: 'Test' });
      const hash = repo.create.mock.calls[0]?.[0]?.keyHash;
      if (!hash) {
        throw new Error('Expected hash to be captured');
      }
      return { key: generated.key, hash };
    };

    it('returns organizationId for matching key', async () => {
      // Arrange
      const { key, hash } = await seedAcceptedKey();
      const lookup: ApiKeyVerifyLookup = {
        id: KEY_ID,
        organizationId: ORG_ID,
        keyHash: hash,
        revokedAt: null,
      };
      repo.findByPrefix.mockResolvedValue(lookup);
      repo.touchLastUsed.mockResolvedValue();

      // Act
      const result = await service.verify(key);

      // Assert
      expect(result).toEqual({ organizationId: ORG_ID });
    });

    it('returns null for unknown prefix', async () => {
      // Arrange
      repo.findByPrefix.mockResolvedValue(null);

      // Act
      const result = await service.verify('fc_live_doesnotexist1234567890');

      // Assert
      expect(result).toBeNull();
    });

    it('returns null when prefix matches but full hash does not', async () => {
      // Arrange
      const { key } = await seedAcceptedKey();
      const wrongHash = 'a'.repeat(64);
      repo.findByPrefix.mockResolvedValue({
        id: KEY_ID,
        organizationId: ORG_ID,
        keyHash: wrongHash,
        revokedAt: null,
      });

      // Act
      const result = await service.verify(key);

      // Assert
      expect(result).toBeNull();
    });

    it('returns null for revoked key (repo filters revokedAt: null)', async () => {
      // Arrange
      // The repo contract filters revoked keys at the DB layer (revokedAt: null
      // in the WHERE clause), so the service receives null for revoked keys.
      repo.findByPrefix.mockResolvedValue(null);

      // Act
      const result = await service.verify('fc_live_revokedkey1234567890');

      // Assert
      expect(result).toBeNull();
      expect(repo.findByPrefix).toHaveBeenCalledTimes(1);
    });

    it('returns null for malformed key without fc_live_ prefix', async () => {
      // Act
      const result = await service.verify('not_a_real_key');

      // Assert
      expect(result).toBeNull();
      expect(repo.findByPrefix).not.toHaveBeenCalled();
    });

    it('does not fail when touchLastUsed rejects', async () => {
      // Arrange
      const { key, hash } = await seedAcceptedKey();
      repo.findByPrefix.mockResolvedValue({
        id: KEY_ID,
        organizationId: ORG_ID,
        keyHash: hash,
        revokedAt: null,
      });
      repo.touchLastUsed.mockRejectedValue(new Error('boom'));

      // Act
      const result = await service.verify(key);

      // Assert — verify still resolves with the success result
      expect(result).toEqual({ organizationId: ORG_ID });
      // Allow the fire-and-forget catch to flush
      await new Promise((resolve) => setImmediate(resolve));
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to touch lastUsedAt',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });
  });

  describe('revoke', () => {
    it('calls markRevoked and returns the record', async () => {
      // Arrange
      const record = buildRecord();
      const revoked = buildRecord({ revokedAt: new Date('2026-04-27T00:00:00.000Z') });
      repo.findById.mockResolvedValue(record);
      repo.markRevoked.mockResolvedValue(revoked);

      // Act
      const result = await service.revoke({ organizationId: ORG_ID, id: KEY_ID });

      // Assert
      expect(repo.markRevoked).toHaveBeenCalledWith(KEY_ID);
      expect(result).toBe(revoked);
    });

    it('throws NotFoundError when record missing', async () => {
      // Arrange
      repo.findById.mockResolvedValue(null);

      // Act + Assert
      await expect(
        service.revoke({ organizationId: ORG_ID, id: KEY_ID }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when org mismatches', async () => {
      // Arrange
      repo.findById.mockResolvedValue(buildRecord({ organizationId: OTHER_ORG_ID }));

      // Act + Assert
      await expect(
        service.revoke({ organizationId: ORG_ID, id: KEY_ID }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('listForOrg', () => {
    it('returns prefix-only entries with no keyHash field', async () => {
      // Arrange
      const records = [buildRecord(), buildRecord({ id: 'second-id' })];
      repo.listByOrg.mockResolvedValue(records);

      // Act
      const result = await service.listForOrg(ORG_ID);

      // Assert
      expect(repo.listByOrg).toHaveBeenCalledWith(ORG_ID);
      expect(result).toBe(records);
      result.forEach((r) => {
        expect(r).not.toHaveProperty('keyHash');
      });
    });
  });
});
