import * as crypto from 'crypto';
import { ForbiddenError, NotFoundError } from '@/shared/errors/commonErrors';
import type { Logger } from '@/shared/utils/logger';
import type {
  ApiKeyRecord,
  ApiKeyRepoPort,
  GenerateApiKeyInput,
  GenerateApiKeyResult,
  VerifyApiKeyResult,
} from '../types/apiKeyTypes';

const KEY_PREFIX_NAMESPACE = 'fc_live_';
const KEY_PREFIX_LENGTH = 12;
const RAW_RANDOM_LENGTH = 24;

export interface ApiKeyService {
  generate(input: GenerateApiKeyInput): Promise<GenerateApiKeyResult>;
  verify(key: string): Promise<VerifyApiKeyResult | null>;
  revoke(input: { organizationId: string; id: string }): Promise<ApiKeyRecord>;
  listForOrg(organizationId: string): Promise<ApiKeyRecord[]>;
}

interface ApiKeyServiceDeps {
  apiKeyRepo: ApiKeyRepoPort;
  logger: Logger;
}

const hashKey = (key: string): string =>
  crypto.createHash('sha256').update(key).digest('hex');

export const createApiKeyService = (deps: ApiKeyServiceDeps): ApiKeyService => ({
  generate: async (input: GenerateApiKeyInput): Promise<GenerateApiKeyResult> => {
    const raw = crypto.randomBytes(18).toString('base64url').slice(0, RAW_RANDOM_LENGTH);
    const key = `${KEY_PREFIX_NAMESPACE}${raw}`;
    const keyHash = hashKey(key);
    const keyPrefix = key.slice(0, KEY_PREFIX_LENGTH);

    const record = await deps.apiKeyRepo.create({
      organizationId: input.organizationId,
      name: input.name,
      keyHash,
      keyPrefix,
    });

    deps.logger.info('API key generated', {
      apiKeyId: record.id,
      organizationId: input.organizationId,
    });

    return { key, record };
  },

  verify: async (key: string): Promise<VerifyApiKeyResult | null> => {
    if (!key.startsWith(KEY_PREFIX_NAMESPACE)) {
      return null;
    }

    const prefix = key.slice(0, KEY_PREFIX_LENGTH);
    const found = await deps.apiKeyRepo.findByPrefix(prefix);
    if (!found) {
      return null;
    }

    const inputHash = hashKey(key);
    if (found.keyHash.length !== inputHash.length) {
      return null;
    }
    if (
      !crypto.timingSafeEqual(
        Buffer.from(found.keyHash, 'hex'),
        Buffer.from(inputHash, 'hex'),
      )
    ) {
      return null;
    }
    if (found.revokedAt !== null) {
      return null;
    }

    deps.apiKeyRepo.touchLastUsed(found.id).catch((error: unknown) => {
      deps.logger.warn('Failed to touch lastUsedAt', { error });
    });

    return { organizationId: found.organizationId };
  },

  revoke: async ({
    organizationId,
    id,
  }: {
    organizationId: string;
    id: string;
  }): Promise<ApiKeyRecord> => {
    const record = await deps.apiKeyRepo.findById(id);
    if (!record) {
      throw new NotFoundError(`OrgApiKey with id ${id} not found`);
    }
    if (record.organizationId !== organizationId) {
      throw new ForbiddenError('Cannot revoke key from another organization');
    }
    return deps.apiKeyRepo.markRevoked(id);
  },

  listForOrg: (organizationId: string): Promise<ApiKeyRecord[]> =>
    deps.apiKeyRepo.listByOrg(organizationId),
});
