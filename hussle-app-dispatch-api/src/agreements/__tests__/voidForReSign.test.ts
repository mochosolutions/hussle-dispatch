import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import { voidForReSign } from '../services/voidForReSign';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { Agreement } from '../types/agreementTypes';

const makeAgreement = (overrides: Partial<Agreement> = {}): Agreement =>
  ({
    id: 'agr-1',
    organizationId: 'org-1',
    carrierId: 'carrier-1',
    templateKey: 'DISPATCH_AGREEMENT',
    providerName: 'MOCK',
    providerSubmissionId: 'sub-1',
    embedUrl: null,
    embedUrlExpiresAt: null,
    signerName: null,
    signerEmail: null,
    status: 'SIGNED',
    variables: {},
    createdByUserId: null,
    voidedByUserId: null,
    voidReason: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    signedAt: new Date('2026-01-02T00:00:00Z'),
    declinedAt: null,
    expiredAt: null,
    voidedAt: null,
    signedPdfS3Key: null,
    signedPdfSha256: null,
    auditCertificateS3Key: null,
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
  const eventBus = { publish: jest.fn() } as unknown as jest.Mocked<EventBus>;
  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  } as unknown as jest.Mocked<Logger>;

  return { agreementRepo, eventBus, logger };
};

describe('voidForReSign', () => {
  it('returns empty list and skips writes when carrier has no signed agreements', async () => {
    const deps = makeDeps();
    deps.agreementRepo.findAllSignedForCarrier.mockResolvedValue([]);

    const result = await voidForReSign(
      { carrierId: 'carrier-1', organizationId: 'org-1', changedFields: ['legalName'] },
      deps,
    );

    expect(result.voidedAgreementIds).toEqual([]);
    expect(deps.agreementRepo.update).not.toHaveBeenCalled();
    expect(deps.eventBus.publish).not.toHaveBeenCalled();
  });

  it('voids every signed agreement for the carrier', async () => {
    const deps = makeDeps();
    const a1 = makeAgreement({ id: 'a-1' });
    const a2 = makeAgreement({ id: 'a-2' });
    deps.agreementRepo.findAllSignedForCarrier.mockResolvedValue([a1, a2]);
    deps.agreementRepo.update.mockImplementation(async (id, patch) =>
      makeAgreement({ ...patch, id }),
    );

    const result = await voidForReSign(
      { carrierId: 'carrier-1', organizationId: 'org-1', changedFields: ['legalName'] },
      deps,
    );

    expect(result.voidedAgreementIds).toEqual(['a-1', 'a-2']);
    expect(deps.agreementRepo.update).toHaveBeenCalledTimes(2);
    expect(deps.agreementRepo.update).toHaveBeenNthCalledWith(
      1,
      'a-1',
      expect.objectContaining({
        status: 'VOIDED',
        voidReason: 'CARRIER_IDENTITY_CHANGED',
      }),
    );
  });

  it('emits one agreement.voided event per affected agreement', async () => {
    const deps = makeDeps();
    const a1 = makeAgreement({ id: 'a-1' });
    deps.agreementRepo.findAllSignedForCarrier.mockResolvedValue([a1]);
    deps.agreementRepo.update.mockImplementation(async (id, patch) =>
      makeAgreement({ ...patch, id, organizationId: 'org-1', carrierId: 'carrier-1' }),
    );

    await voidForReSign(
      { carrierId: 'carrier-1', organizationId: 'org-1', changedFields: ['mcNumber'] },
      deps,
    );

    expect(deps.eventBus.publish).toHaveBeenCalledTimes(1);
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'agreement.voided',
      expect.objectContaining({
        agreementId: 'a-1',
        organizationId: 'org-1',
        carrierId: 'carrier-1',
        voidReason: 'CARRIER_IDENTITY_CHANGED',
        voidedByUserId: null,
      }),
    );
  });
});
