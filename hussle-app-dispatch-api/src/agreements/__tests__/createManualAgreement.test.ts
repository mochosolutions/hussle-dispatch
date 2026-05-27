import type { Logger } from '@/shared/utils/logger';

import {
  AgreementAlreadySignedError,
  AgreementPendingExistsError,
  CarrierNotFoundError,
} from '../errors/agreementErrors';
import {
  createManualAgreement,
  type CreateManualAgreementInput,
  type CreateManualAgreementDeps,
} from '../services/createManualAgreement';
import type { CarrierQueryPort } from '../services/requestAgreement';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { Agreement } from '../types/agreementTypes';

const FIXED_NOW = new Date('2026-05-27T08:00:00.000Z');

const makeAgreement = (overrides: Partial<Agreement> = {}): Agreement =>
  ({
    id: 'ag-1',
    organizationId: 'org-1',
    carrierId: 'car-1',
    templateKey: 'DISPATCH_AGREEMENT',
    providerName: 'MANUAL',
    providerSubmissionId: null,
    embedUrl: null,
    embedUrlExpiresAt: null,
    signerName: 'Alice Owner',
    signerEmail: 'alice@example.com',
    variables: {},
    status: 'SIGNED',
    createdByUserId: 'user-1',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    signedAt: FIXED_NOW,
    declinedAt: null,
    expiredAt: null,
    voidedAt: null,
    voidedByUserId: null,
    voidReason: null,
    signedPdfS3Key: 'orgs/org-1/agreements/ag-1/signed.pdf',
    auditCertificateS3Key: null,
    signedPdfSha256: null,
    ...overrides,
  }) as Agreement;

const makeCarrier = (
  overrides: Partial<Awaited<ReturnType<CarrierQueryPort['findById']>>> = {},
) => ({
  id: 'car-1',
  legalName: 'Acme Trucking LLC',
  mcNumber: 'MC123456',
  dotNumber: 'DOT789',
  primaryContactName: 'Bob Carrier',
  primaryContactEmail: 'bob@acme.test',
  ...overrides,
});

const makeDeps = (): {
  deps: CreateManualAgreementDeps;
  mocks: {
    agreementRepo: jest.Mocked<AgreementRepoPort>;
    carrierQueries: jest.Mocked<CarrierQueryPort>;
    logger: jest.Mocked<Logger>;
  };
} => {
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
  const carrierQueries: jest.Mocked<CarrierQueryPort> = {
    findById: jest.fn(),
  };
  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return {
    deps: { agreementRepo, carrierQueries, logger },
    mocks: { agreementRepo, carrierQueries, logger },
  };
};

const makeInput = (
  overrides: Partial<CreateManualAgreementInput> = {},
): CreateManualAgreementInput => ({
  organizationId: 'org-1',
  carrierId: 'car-1',
  templateKey: 'DISPATCH_AGREEMENT',
  signedPdfS3Key: 'orgs/org-1/agreements/ag-1/signed.pdf',
  signerName: 'Alice Owner',
  signerEmail: 'alice@example.com',
  signedAt: FIXED_NOW,
  createdByUserId: 'user-1',
  ...overrides,
});

describe('createManualAgreement', () => {
  it('creates a SIGNED agreement with the uploaded PDF key when no existing agreement', async () => {
    const { deps, mocks } = makeDeps();
    mocks.carrierQueries.findById.mockResolvedValue(makeCarrier());
    mocks.agreementRepo.findLatestForCarrier.mockResolvedValue(null);
    mocks.agreementRepo.create.mockResolvedValue(makeAgreement({ signedPdfS3Key: null }));
    mocks.agreementRepo.update.mockResolvedValue(makeAgreement());

    const result = await createManualAgreement(makeInput(), deps);

    expect(result.data.status).toBe('SIGNED');
    expect(result.data.providerName).toBe('MANUAL');
    expect(result.data.signedPdfS3Key).toBe('orgs/org-1/agreements/ag-1/signed.pdf');
    expect(result.events).toEqual([]);
    expect(mocks.agreementRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        carrierId: 'car-1',
        templateKey: 'DISPATCH_AGREEMENT',
        providerName: 'MANUAL',
        embedUrl: null,
        status: 'SIGNED',
      }),
    );
    expect(mocks.agreementRepo.update).toHaveBeenCalledWith(
      'ag-1',
      expect.objectContaining({
        signedPdfS3Key: 'orgs/org-1/agreements/ag-1/signed.pdf',
        signedAt: FIXED_NOW,
      }),
    );
  });

  it('throws CarrierNotFoundError when the carrier does not exist in the org', async () => {
    const { deps, mocks } = makeDeps();
    mocks.carrierQueries.findById.mockResolvedValue(null);

    await expect(createManualAgreement(makeInput(), deps)).rejects.toBeInstanceOf(
      CarrierNotFoundError,
    );
    expect(mocks.agreementRepo.create).not.toHaveBeenCalled();
  });

  it('throws AgreementPendingExistsError when an existing PENDING agreement is present', async () => {
    const { deps, mocks } = makeDeps();
    mocks.carrierQueries.findById.mockResolvedValue(makeCarrier());
    mocks.agreementRepo.findLatestForCarrier.mockResolvedValue(
      makeAgreement({ status: 'PENDING', voidedAt: null, signedAt: null }),
    );

    await expect(createManualAgreement(makeInput(), deps)).rejects.toBeInstanceOf(
      AgreementPendingExistsError,
    );
    expect(mocks.agreementRepo.create).not.toHaveBeenCalled();
  });

  it('throws AgreementAlreadySignedError when a non-voided SIGNED agreement already exists', async () => {
    const { deps, mocks } = makeDeps();
    mocks.carrierQueries.findById.mockResolvedValue(makeCarrier());
    mocks.agreementRepo.findLatestForCarrier.mockResolvedValue(
      makeAgreement({ status: 'SIGNED', voidedAt: null }),
    );

    await expect(createManualAgreement(makeInput(), deps)).rejects.toBeInstanceOf(
      AgreementAlreadySignedError,
    );
    expect(mocks.agreementRepo.create).not.toHaveBeenCalled();
  });

  it('allows creation when the only prior agreement is voided', async () => {
    const { deps, mocks } = makeDeps();
    mocks.carrierQueries.findById.mockResolvedValue(makeCarrier());
    mocks.agreementRepo.findLatestForCarrier.mockResolvedValue(
      makeAgreement({ status: 'SIGNED', voidedAt: FIXED_NOW }),
    );
    mocks.agreementRepo.create.mockResolvedValue(makeAgreement({ signedPdfS3Key: null }));
    mocks.agreementRepo.update.mockResolvedValue(makeAgreement());

    const result = await createManualAgreement(makeInput(), deps);

    expect(result.data.status).toBe('SIGNED');
    expect(mocks.agreementRepo.create).toHaveBeenCalledTimes(1);
  });
});
