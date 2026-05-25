import { ForbiddenError, NotFoundError } from '@/shared/errors';
import type { Logger } from '@/shared/utils/logger';

import {
  mockSignAgreement,
  type MockSignAgreementDeps,
  type MockSignAgreementInput,
} from '../services/mockSignAgreement';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { Agreement } from '../types/agreementTypes';

const FIXED_NOW = new Date('2026-05-23T15:00:00.000Z');

const makeAgreement = (overrides: Partial<Agreement> = {}): Agreement =>
  ({
    id: 'ag-1',
    organizationId: 'org-1',
    carrierId: 'car-1',
    templateKey: 'DISPATCH_AGREEMENT',
    providerName: 'MOCK',
    providerSubmissionId: 'sub_abc',
    embedUrl: 'http://localhost:3030/s/abc',
    embedUrlExpiresAt: null,
    signerName: 'Bob',
    signerEmail: 'bob@example.com',
    variables: {},
    status: 'PENDING',
    createdByUserId: null,
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

const makeDeps = () => {
  const agreementRepo: jest.Mocked<AgreementRepoPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByProviderSubmissionId: jest.fn(),
    findManyByOrg: jest.fn(),
    findLatestForCarrier: jest.fn(),
    findAllSignedForCarrier: jest.fn(),
    update: jest.fn(),
    findStaleInProgress: jest.fn(),
    countActivePending: jest.fn(),
    findManySigned: jest.fn(),
  };
  const markSigned = jest.fn<(providerSubmissionId: string) => void>();
  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const deps: MockSignAgreementDeps = {
    agreementRepo,
    markSigned,
    logger,
    now: () => FIXED_NOW,
  };
  return { agreementRepo, markSigned, logger, deps };
};

const baseInput = (
  overrides: Partial<MockSignAgreementInput> = {},
): MockSignAgreementInput => ({
  agreementId: 'ag-1',
  carrierId: 'car-1',
  ...overrides,
});

describe('mockSignAgreement', () => {
  it('flips status to SIGNED, calls markSigned, and returns updated row', async () => {
    const fixtures = makeDeps();
    const existing = makeAgreement();
    fixtures.agreementRepo.findById.mockResolvedValue(existing);
    fixtures.agreementRepo.update.mockResolvedValue({
      ...existing,
      status: 'SIGNED',
      signedAt: FIXED_NOW,
    });

    const result = await mockSignAgreement(baseInput(), fixtures.deps);

    expect(fixtures.markSigned).toHaveBeenCalledWith('sub_abc');
    expect(fixtures.agreementRepo.update).toHaveBeenCalledWith('ag-1', {
      status: 'SIGNED',
      signedAt: FIXED_NOW,
    });
    expect(result.data.status).toBe('SIGNED');
    expect(result.events).toEqual([]);
  });

  it('throws NotFoundError when agreement does not exist', async () => {
    const fixtures = makeDeps();
    fixtures.agreementRepo.findById.mockResolvedValue(null);

    await expect(mockSignAgreement(baseInput(), fixtures.deps)).rejects.toThrow(NotFoundError);
    expect(fixtures.markSigned).not.toHaveBeenCalled();
    expect(fixtures.agreementRepo.update).not.toHaveBeenCalled();
  });

  it('throws ForbiddenError when carrierId does not match agreement.carrierId', async () => {
    const fixtures = makeDeps();
    fixtures.agreementRepo.findById.mockResolvedValue(
      makeAgreement({ carrierId: 'other-carrier' }),
    );

    await expect(mockSignAgreement(baseInput(), fixtures.deps)).rejects.toThrow(ForbiddenError);
    expect(fixtures.markSigned).not.toHaveBeenCalled();
    expect(fixtures.agreementRepo.update).not.toHaveBeenCalled();
  });

  it('skips markSigned when providerSubmissionId is null but still flips status', async () => {
    const fixtures = makeDeps();
    const existing = makeAgreement({ providerSubmissionId: null });
    fixtures.agreementRepo.findById.mockResolvedValue(existing);
    fixtures.agreementRepo.update.mockResolvedValue({
      ...existing,
      status: 'SIGNED',
      signedAt: FIXED_NOW,
    });

    await mockSignAgreement(baseInput(), fixtures.deps);

    expect(fixtures.markSigned).not.toHaveBeenCalled();
    expect(fixtures.agreementRepo.update).toHaveBeenCalled();
  });

  // Reproduces the Docker-reload edge case: the in-memory mock provider's
  // submissions Map is wiped on process restart, but the Agreement row in
  // PostgreSQL outlives that. The DB flip is the user-visible source of
  // truth — we log the gap and proceed rather than 500ing the request.
  it('logs a warning and still flips status when markSigned throws "Submission not found"', async () => {
    const fixtures = makeDeps();
    const existing = makeAgreement();
    fixtures.agreementRepo.findById.mockResolvedValue(existing);
    fixtures.agreementRepo.update.mockResolvedValue({
      ...existing,
      status: 'SIGNED',
      signedAt: FIXED_NOW,
    });
    fixtures.markSigned.mockImplementation(() => {
      throw new Error('Submission not found');
    });

    const result = await mockSignAgreement(baseInput(), fixtures.deps);

    expect(fixtures.markSigned).toHaveBeenCalledWith('sub_abc');
    expect(fixtures.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Mock provider had no record'),
      expect.objectContaining({ agreementId: 'ag-1', providerSubmissionId: 'sub_abc' }),
    );
    expect(fixtures.agreementRepo.update).toHaveBeenCalled();
    expect(result.data.status).toBe('SIGNED');
  });
});
