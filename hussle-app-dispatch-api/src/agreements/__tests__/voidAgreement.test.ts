import { ForbiddenError } from '@/shared/errors';
import type { SignatureService } from '@/shared/signatures/types';
import type { Logger } from '@/shared/utils/logger';

import { AgreementNotVoidableError } from '../errors/agreementErrors';
import {
  voidAgreement,
  type VoidAgreementDeps,
  type VoidAgreementInput,
} from '../services/voidAgreement';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { Agreement, AgreementStatus } from '../types/agreementTypes';

const FIXED_NOW = new Date('2026-05-14T12:00:00.000Z');

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
  };
  const signatureService: jest.Mocked<SignatureService> = {
    createSubmission: jest.fn(),
    getSubmission: jest.fn(),
    voidSubmission: jest.fn(),
    fetchSignedArtifacts: jest.fn(),
    refreshEmbedUrl: jest.fn(),
  };
  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const now = jest.fn<Date, []>().mockReturnValue(FIXED_NOW);

  const deps: VoidAgreementDeps = { agreementRepo, signatureService, logger, now };
  return { deps, agreementRepo, signatureService, logger, now };
};

const baseInput = (overrides: Partial<VoidAgreementInput> = {}): VoidAgreementInput => ({
  agreementId: 'ag-1',
  organizationId: 'org-1',
  requestingUserId: 'user-1',
  reason: 'Carrier requested cancellation',
  ...overrides,
});

describe('voidAgreement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('voids a PENDING agreement, calls signatureService.voidSubmission, and emits agreement.voided event', async () => {
    const fixtures = makeDeps();
    const pending = makeAgreement({ status: 'PENDING', providerSubmissionId: 'sub_abc' });
    fixtures.agreementRepo.findById.mockResolvedValue(pending);
    const updated = makeAgreement({
      status: 'VOIDED',
      voidedAt: FIXED_NOW,
      voidedByUserId: 'user-1',
      voidReason: 'Carrier requested cancellation',
    });
    fixtures.agreementRepo.update.mockResolvedValue(updated);

    const result = await voidAgreement(baseInput(), fixtures.deps);

    expect(fixtures.signatureService.voidSubmission).toHaveBeenCalledWith('sub_abc');
    expect(fixtures.agreementRepo.update).toHaveBeenCalledWith('ag-1', {
      status: 'VOIDED',
      voidedAt: FIXED_NOW,
      voidedByUserId: 'user-1',
      voidReason: 'Carrier requested cancellation',
    });
    expect(result.data).toBe(updated);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toEqual({
      type: 'agreement.voided',
      occurredAt: FIXED_NOW,
      payload: {
        agreementId: 'ag-1',
        organizationId: 'org-1',
        carrierId: 'car-1',
        voidedAt: FIXED_NOW.toISOString(),
        voidReason: 'Carrier requested cancellation',
        voidedByUserId: 'user-1',
      },
    });
  });

  it('throws ForbiddenError when the agreement organizationId does not match the input', async () => {
    const fixtures = makeDeps();
    fixtures.agreementRepo.findById.mockResolvedValue(
      makeAgreement({ organizationId: 'other-org' }),
    );

    await expect(voidAgreement(baseInput(), fixtures.deps)).rejects.toThrow(ForbiddenError);
    expect(fixtures.signatureService.voidSubmission).not.toHaveBeenCalled();
    expect(fixtures.agreementRepo.update).not.toHaveBeenCalled();
  });

  it('throws AgreementNotVoidableError (statusCode 409, code AGREEMENT_NOT_VOIDABLE) when agreement.status is SIGNED', async () => {
    const fixtures = makeDeps();
    fixtures.agreementRepo.findById.mockResolvedValue(
      makeAgreement({ status: 'SIGNED' as AgreementStatus }),
    );

    const promise = voidAgreement(baseInput(), fixtures.deps);
    await expect(promise).rejects.toBeInstanceOf(AgreementNotVoidableError);
    await expect(promise).rejects.toMatchObject({
      statusCode: 409,
      code: 'AGREEMENT_NOT_VOIDABLE',
    });
    expect(fixtures.signatureService.voidSubmission).not.toHaveBeenCalled();
    expect(fixtures.agreementRepo.update).not.toHaveBeenCalled();
  });

  it('throws AgreementNotVoidableError when agreement.status is already VOIDED', async () => {
    const fixtures = makeDeps();
    fixtures.agreementRepo.findById.mockResolvedValue(
      makeAgreement({ status: 'VOIDED' as AgreementStatus }),
    );

    const promise = voidAgreement(baseInput(), fixtures.deps);
    await expect(promise).rejects.toBeInstanceOf(AgreementNotVoidableError);
    await expect(promise).rejects.toMatchObject({
      statusCode: 409,
      code: 'AGREEMENT_NOT_VOIDABLE',
    });
    expect(fixtures.signatureService.voidSubmission).not.toHaveBeenCalled();
    expect(fixtures.agreementRepo.update).not.toHaveBeenCalled();
  });

  it('propagates voidSubmission rejections without swallowing and does not call agreementRepo.update', async () => {
    const fixtures = makeDeps();
    fixtures.agreementRepo.findById.mockResolvedValue(makeAgreement());
    fixtures.signatureService.voidSubmission.mockRejectedValue(new Error('provider down'));

    await expect(voidAgreement(baseInput(), fixtures.deps)).rejects.toThrow('provider down');
    expect(fixtures.agreementRepo.update).not.toHaveBeenCalled();
  });

  it('persists voidReason as null when input.reason is omitted', async () => {
    const fixtures = makeDeps();
    fixtures.agreementRepo.findById.mockResolvedValue(makeAgreement());
    fixtures.agreementRepo.update.mockResolvedValue(
      makeAgreement({ status: 'VOIDED', voidedAt: FIXED_NOW, voidReason: null, voidedByUserId: 'user-1' }),
    );

    const input: VoidAgreementInput = {
      agreementId: 'ag-1',
      organizationId: 'org-1',
      requestingUserId: 'user-1',
    };
    const result = await voidAgreement(input, fixtures.deps);

    expect(fixtures.agreementRepo.update).toHaveBeenCalledWith(
      'ag-1',
      expect.objectContaining({ voidReason: null }),
    );
    expect(result.events[0]?.payload).toEqual(
      expect.objectContaining({ voidReason: null }),
    );
  });
});
