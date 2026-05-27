import { NotFoundError, ValidationError } from '@/shared/errors';
import type { SignatureService, SubmissionRef } from '@/shared/signatures/types';
import type { Logger } from '@/shared/utils/logger';

import { AgreementAlreadyPendingError } from '../errors/agreementErrors';
import {
  requestAgreement,
  type CarrierQueryPort,
  type RequestAgreementDeps,
  type RequestAgreementInput,
} from '../services/requestAgreement';
import { DISPATCH_AGREEMENT_FIELDS } from '../templates/dispatchAgreementFields';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { Agreement } from '../types/agreementTypes';

const FIXED_NOW = new Date('2026-05-14T12:00:00.000Z');

const makeRef = (overrides: Partial<SubmissionRef> = {}): SubmissionRef => ({
  providerSubmissionId: 'sub_abc',
  embedUrl: 'https://example.com/embed/sub_abc',
  expiresAt: new Date('2026-12-31T00:00:00.000Z'),
  ...overrides,
});

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

const makeCarrier = (overrides: Partial<Awaited<ReturnType<CarrierQueryPort['findById']>>> = {}) => ({
  id: 'car-1',
  legalName: 'Acme Trucking LLC',
  mcNumber: 'MC123456',
  dotNumber: 'DOT789',
  primaryContactName: 'Bob Carrier',
  primaryContactEmail: 'bob@acme.test',
  ...overrides,
});

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
  const signatureService: jest.Mocked<SignatureService> = {
    createSubmission: jest.fn(),
    getSubmission: jest.fn(),
    voidSubmission: jest.fn(),
    fetchSignedArtifacts: jest.fn(),
    refreshEmbedUrl: jest.fn(),
  };
  const carrierQueries: jest.Mocked<CarrierQueryPort> = { findById: jest.fn() };
  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const uuid = jest.fn<string, []>().mockReturnValue('corr-uuid');
  const now = jest.fn<Date, []>().mockReturnValue(FIXED_NOW);

  const deps: RequestAgreementDeps = {
    agreementRepo,
    signatureService,
    carrierQueries,
    providerName: 'MOCK',
    logger,
    uuid,
    now,
  };

  return { deps, agreementRepo, signatureService, carrierQueries, logger, uuid, now };
};

const baseInput = (overrides: Partial<RequestAgreementInput> = {}): RequestAgreementInput => ({
  carrierId: 'car-1',
  templateKey: 'DISPATCH_AGREEMENT',
  organizationId: 'org-1',
  requestingUserId: 'user-1',
  orgName: 'Hussle Dispatch',
  ...overrides,
});

describe('requestAgreement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists PENDING agreement and emits agreement.generated when carrier has no pending agreement', async () => {
    const fixtures = makeDeps();
    fixtures.carrierQueries.findById.mockResolvedValue(makeCarrier());
    fixtures.agreementRepo.countActivePending.mockResolvedValue(0);
    fixtures.signatureService.createSubmission.mockResolvedValue(makeRef());
    const persisted = makeAgreement();
    fixtures.agreementRepo.create.mockResolvedValue(persisted);

    const result = await requestAgreement(baseInput(), fixtures.deps);

    expect(fixtures.agreementRepo.create).toHaveBeenCalledTimes(1);
    expect(fixtures.agreementRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        carrierId: 'car-1',
        templateKey: 'DISPATCH_AGREEMENT',
        providerName: 'MOCK',
        providerSubmissionId: 'sub_abc',
        embedUrl: 'https://example.com/embed/sub_abc',
        status: 'PENDING',
        createdByUserId: 'user-1',
      }),
    );
    expect(result.data).toBe(persisted);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.type).toBe('agreement.generated');
    expect(result.events[0]?.payload).toEqual(
      expect.objectContaining({
        agreementId: 'ag-1',
        organizationId: 'org-1',
        carrierId: 'car-1',
        templateKey: 'DISPATCH_AGREEMENT',
        providerSubmissionId: 'sub_abc',
        correlationId: 'corr-uuid',
      }),
    );
  });

  it('throws NotFoundError when carrier does not exist', async () => {
    const fixtures = makeDeps();
    fixtures.carrierQueries.findById.mockResolvedValue(null);

    await expect(requestAgreement(baseInput(), fixtures.deps)).rejects.toThrow(NotFoundError);
    expect(fixtures.agreementRepo.create).not.toHaveBeenCalled();
    expect(fixtures.signatureService.createSubmission).not.toHaveBeenCalled();
  });

  it('throws AgreementAlreadyPendingError with code AGREEMENT_ALREADY_PENDING when carrier already has a pending agreement', async () => {
    const fixtures = makeDeps();
    fixtures.carrierQueries.findById.mockResolvedValue(makeCarrier());
    fixtures.agreementRepo.countActivePending.mockResolvedValue(1);

    await expect(requestAgreement(baseInput(), fixtures.deps)).rejects.toMatchObject({
      code: 'AGREEMENT_ALREADY_PENDING',
    });
    await expect(requestAgreement(baseInput(), fixtures.deps)).rejects.toBeInstanceOf(
      AgreementAlreadyPendingError,
    );
    expect(fixtures.signatureService.createSubmission).not.toHaveBeenCalled();
    expect(fixtures.agreementRepo.create).not.toHaveBeenCalled();
  });

  it('prefers input.signerEmail over carrier.primaryContactEmail when both are provided', async () => {
    const fixtures = makeDeps();
    fixtures.carrierQueries.findById.mockResolvedValue(
      makeCarrier({ primaryContactEmail: 'fallback@acme.test' }),
    );
    fixtures.agreementRepo.countActivePending.mockResolvedValue(0);
    fixtures.signatureService.createSubmission.mockResolvedValue(makeRef());
    fixtures.agreementRepo.create.mockResolvedValue(makeAgreement());

    await requestAgreement(
      baseInput({ signerEmail: 'override@signer.test', signerName: 'Override Name' }),
      fixtures.deps,
    );

    expect(fixtures.signatureService.createSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        signer: { name: 'Override Name', email: 'override@signer.test' },
      }),
      expect.any(Object),
    );
    expect(fixtures.agreementRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        signerEmail: 'override@signer.test',
        signerName: 'Override Name',
      }),
    );
  });

  it('throws ValidationError when carrier has no primary contact email and input.signerEmail is missing', async () => {
    const fixtures = makeDeps();
    fixtures.carrierQueries.findById.mockResolvedValue(
      makeCarrier({ primaryContactEmail: null }),
    );
    fixtures.agreementRepo.countActivePending.mockResolvedValue(0);

    await expect(requestAgreement(baseInput(), fixtures.deps)).rejects.toThrow(ValidationError);
    expect(fixtures.signatureService.createSubmission).not.toHaveBeenCalled();
  });

  it('passes input.correlationId verbatim to both the event payload and signatureService.createSubmission opts', async () => {
    const fixtures = makeDeps();
    fixtures.carrierQueries.findById.mockResolvedValue(makeCarrier());
    fixtures.agreementRepo.countActivePending.mockResolvedValue(0);
    fixtures.signatureService.createSubmission.mockResolvedValue(makeRef());
    fixtures.agreementRepo.create.mockResolvedValue(makeAgreement());

    const result = await requestAgreement(
      baseInput({ correlationId: 'caller-supplied-corr' }),
      fixtures.deps,
    );

    expect(fixtures.signatureService.createSubmission).toHaveBeenCalledWith(
      expect.any(Object),
      { correlationId: 'caller-supplied-corr' },
    );
    expect(result.events[0]?.payload).toEqual(
      expect.objectContaining({ correlationId: 'caller-supplied-corr' }),
    );
    // uuid generator never invoked when correlationId provided
    expect(fixtures.uuid).not.toHaveBeenCalled();
  });

  it('passes correctly-shaped values to signatureService.createSubmission', async () => {
    const fixtures = makeDeps();
    fixtures.carrierQueries.findById.mockResolvedValue(
      makeCarrier({
        legalName: 'Acme Trucking LLC',
        mcNumber: 'MC123456',
        dotNumber: 'DOT789',
      }),
    );
    fixtures.agreementRepo.countActivePending.mockResolvedValue(0);
    fixtures.signatureService.createSubmission.mockResolvedValue(makeRef());
    fixtures.agreementRepo.create.mockResolvedValue(makeAgreement());

    await requestAgreement(baseInput({ orgName: 'Hussle Dispatch' }), fixtures.deps);

    expect(fixtures.signatureService.createSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: 'DISPATCH_AGREEMENT',
        variables: {
          [DISPATCH_AGREEMENT_FIELDS.CARRIER_LEGAL_NAME]: 'Acme Trucking LLC',
          [DISPATCH_AGREEMENT_FIELDS.CARRIER_MC_NUMBER]: 'MC123456',
          [DISPATCH_AGREEMENT_FIELDS.CARRIER_DOT_NUMBER]: 'DOT789',
          [DISPATCH_AGREEMENT_FIELDS.DISPATCHER_ORG_NAME]: 'Hussle Dispatch',
          [DISPATCH_AGREEMENT_FIELDS.EFFECTIVE_DATE]: '2026-05-14',
        },
        metadata: {
          carrierId: 'car-1',
          organizationId: 'org-1',
        },
      }),
      expect.any(Object),
    );
  });
});
