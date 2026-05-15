import { NotFoundError } from '@/shared/errors';
import type { SignatureService, SignedArtifacts } from '@/shared/signatures/types';
import type { StorageProvider } from '@/shared/storage/storageProvider';
import type { Logger } from '@/shared/utils/logger';

import {
  finalizeAgreement,
  type FinalizeAgreementDeps,
} from '../services/finalizeAgreement';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { Agreement, AgreementStatus } from '../types/agreementTypes';

const FIXED_NOW = new Date('2026-05-14T12:00:00.000Z');

// SHA-256 of Buffer.from('test') — used to verify checksum correctness.
const KNOWN_BUFFER = Buffer.from('test');
const KNOWN_SHA256 = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

const makeAgreement = (overrides: Partial<Agreement> = {}): Agreement =>
  ({
    id: 'ag-1',
    organizationId: 'org-1',
    carrierId: 'car-1',
    templateKey: 'DISPATCH_AGREEMENT',
    providerName: 'MOCK',
    providerSubmissionId: 'sub_abc',
    embedUrl: 'https://example.com/embed/sub_abc',
    embedUrlExpiresAt: new Date('2026-12-31T00:00:00.000Z'),
    signerName: 'Alice',
    signerEmail: 'alice@example.com',
    variables: {},
    status: 'PENDING',
    createdByUserId: 'user-1',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    signedAt: null,
    declinedAt: null,
    expiredAt: null,
    voidedAt: null,
    voidedByUserId: null,
    voidReason: null,
    signedPdfS3Key: null,
    auditCertificateS3Key: null,
    signedPdfSha256: null,
    ...overrides,
  }) as Agreement;

const makeArtifacts = (overrides: Partial<SignedArtifacts> = {}): SignedArtifacts => ({
  signedPdf: Buffer.from('PDF-SIGNED-CONTENT'),
  auditCertificate: Buffer.from('PDF-AUDIT-CONTENT'),
  ...overrides,
});

const makeStorage = (): jest.Mocked<StorageProvider> => ({
  put: jest.fn().mockResolvedValue('s3-key'),
  get: jest.fn(),
  getFile: jest.fn(),
  getPresignedPutUrl: jest.fn(),
  getPresignedGetUrl: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  deleteByPrefix: jest.fn(),
  list: jest.fn(),
  exists: jest.fn(),
  getMetadata: jest.fn(),
});

const makeDeps = () => {
  const agreementRepo: jest.Mocked<AgreementRepoPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByProviderSubmissionId: jest.fn(),
    findManyByOrg: jest.fn(),
    update: jest.fn(),
    findStaleInProgress: jest.fn(),
    countActivePending: jest.fn(),
  };
  const signatureService: jest.Mocked<SignatureService> = {
    createSubmission: jest.fn(),
    getSubmission: jest.fn(),
    voidSubmission: jest.fn(),
    fetchSignedArtifacts: jest.fn(),
  };
  const storage = makeStorage();
  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const now = jest.fn<Date, []>().mockReturnValue(FIXED_NOW);

  const deps: FinalizeAgreementDeps = { agreementRepo, signatureService, storage, logger, now };
  return { deps, agreementRepo, signatureService, storage, logger, now };
};

const SIGNED_KEY = 'orgs/org-1/carriers/car-1/agreements/ag-1/signed.pdf';
const AUDIT_KEY = 'orgs/org-1/carriers/car-1/agreements/ag-1/audit-certificate.pdf';

describe('finalizeAgreement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finalizes a PENDING agreement: fetches artifacts, writes both files to storage, persists SIGNED, emits agreement.finalized', async () => {
    const fixtures = makeDeps();
    fixtures.agreementRepo.findByProviderSubmissionId.mockResolvedValue(makeAgreement());
    const artifacts = makeArtifacts();
    fixtures.signatureService.fetchSignedArtifacts.mockResolvedValue(artifacts);
    const updated = makeAgreement({
      status: 'SIGNED',
      signedAt: FIXED_NOW,
      signedPdfS3Key: SIGNED_KEY,
      auditCertificateS3Key: AUDIT_KEY,
      signedPdfSha256: 'computed-hash',
    });
    fixtures.agreementRepo.update.mockResolvedValue(updated);

    const result = await finalizeAgreement({ providerSubmissionId: 'sub_abc' }, fixtures.deps);

    expect(fixtures.signatureService.fetchSignedArtifacts).toHaveBeenCalledTimes(1);
    expect(fixtures.signatureService.fetchSignedArtifacts).toHaveBeenCalledWith('sub_abc');
    expect(fixtures.storage.put).toHaveBeenCalledTimes(2);
    expect(fixtures.storage.put).toHaveBeenNthCalledWith(1, SIGNED_KEY, artifacts.signedPdf, 'application/pdf');
    expect(fixtures.storage.put).toHaveBeenNthCalledWith(2, AUDIT_KEY, artifacts.auditCertificate, 'application/pdf');
    expect(fixtures.agreementRepo.update).toHaveBeenCalledWith(
      'ag-1',
      expect.objectContaining({
        status: 'SIGNED',
        signedAt: FIXED_NOW,
        signedPdfS3Key: SIGNED_KEY,
        auditCertificateS3Key: AUDIT_KEY,
        signedPdfSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
    );
    expect(result.data).toBe(updated);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.type).toBe('agreement.finalized');
    expect(result.events[0]?.payload).toEqual(
      expect.objectContaining({
        agreementId: 'ag-1',
        organizationId: 'org-1',
        carrierId: 'car-1',
        signedPdfS3Key: SIGNED_KEY,
        auditCertificateS3Key: AUDIT_KEY,
      }),
    );
  });

  it('is idempotent: when agreement is already SIGNED, returns existing data with zero side effects', async () => {
    const fixtures = makeDeps();
    const alreadySigned = makeAgreement({
      status: 'SIGNED' as AgreementStatus,
      signedAt: new Date('2026-05-13T00:00:00.000Z'),
      signedPdfS3Key: 'pre-existing-key',
    });
    fixtures.agreementRepo.findByProviderSubmissionId.mockResolvedValue(alreadySigned);

    const result = await finalizeAgreement({ providerSubmissionId: 'sub_abc' }, fixtures.deps);

    expect(result.data).toBe(alreadySigned);
    expect(result.events).toEqual([]);
    expect(fixtures.signatureService.fetchSignedArtifacts).not.toHaveBeenCalled();
    expect(fixtures.storage.put).not.toHaveBeenCalled();
    expect(fixtures.agreementRepo.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when no agreement matches the providerSubmissionId', async () => {
    const fixtures = makeDeps();
    fixtures.agreementRepo.findByProviderSubmissionId.mockResolvedValue(null);

    await expect(
      finalizeAgreement({ providerSubmissionId: 'unknown' }, fixtures.deps),
    ).rejects.toThrow(NotFoundError);
    expect(fixtures.signatureService.fetchSignedArtifacts).not.toHaveBeenCalled();
    expect(fixtures.storage.put).not.toHaveBeenCalled();
  });

  it('computes the correct SHA-256 hex of the signed PDF buffer', async () => {
    const fixtures = makeDeps();
    fixtures.agreementRepo.findByProviderSubmissionId.mockResolvedValue(makeAgreement());
    fixtures.signatureService.fetchSignedArtifacts.mockResolvedValue(
      makeArtifacts({ signedPdf: KNOWN_BUFFER }),
    );
    fixtures.agreementRepo.update.mockImplementation(async (_id, patch) =>
      makeAgreement({
        status: 'SIGNED',
        signedPdfSha256: patch.signedPdfSha256 ?? null,
      }),
    );

    await finalizeAgreement({ providerSubmissionId: 'sub_abc' }, fixtures.deps);

    expect(fixtures.agreementRepo.update).toHaveBeenCalledWith(
      'ag-1',
      expect.objectContaining({ signedPdfSha256: KNOWN_SHA256 }),
    );
  });

  it('does not call agreementRepo.update when storage.put fails on the first artifact', async () => {
    const fixtures = makeDeps();
    fixtures.agreementRepo.findByProviderSubmissionId.mockResolvedValue(makeAgreement());
    fixtures.signatureService.fetchSignedArtifacts.mockResolvedValue(makeArtifacts());
    fixtures.storage.put.mockRejectedValueOnce(new Error('S3 unavailable'));

    await expect(
      finalizeAgreement({ providerSubmissionId: 'sub_abc' }, fixtures.deps),
    ).rejects.toThrow('S3 unavailable');
    expect(fixtures.agreementRepo.update).not.toHaveBeenCalled();
  });
});
