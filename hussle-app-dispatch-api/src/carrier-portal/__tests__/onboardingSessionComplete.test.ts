import type { Carrier, OnboardingSession, Prisma } from '@prisma/client';
import { createOnboardingSessionService } from '../services/onboardingSessionService';
import { OnboardingBlockError } from '@/shared/errors/commonErrors';
import type { DerivedComplianceDeps } from '@/carriers/services/derivedCompliance';
import type { DocumentRepoPort } from '@/documents/types/documentTypes';
import type { AgreementRepoPort } from '@/agreements/types/agreementRepoPort';

interface ComplianceState {
  insuranceOnFile?: boolean;
  insuranceExpiry?: Date | null;
  agreementOnFile?: boolean;
}

const buildDerivedComplianceDeps = (state: ComplianceState = {}): DerivedComplianceDeps => {
  const insuranceOnFile = state.insuranceOnFile ?? true;
  const agreementOnFile = state.agreementOnFile ?? true;
  const documentRepo: jest.Mocked<Pick<DocumentRepoPort, 'findManyForCompliance'>> = {
    findManyForCompliance: jest.fn(async (carrierIds: string[]) =>
      insuranceOnFile
        ? carrierIds.map(
            (entityId) =>
              ({
                id: `doc-${entityId}`,
                entityId,
                type: 'INSURANCE_CERT',
                createdAt: new Date(),
                expiresAt: state.insuranceExpiry ?? null,
              }) as Awaited<ReturnType<DocumentRepoPort['findManyForCompliance']>>[number],
          )
        : [],
    ),
  };
  const agreementRepo: jest.Mocked<Pick<AgreementRepoPort, 'findManySigned'>> = {
    findManySigned: jest.fn(async (carrierIds: string[]) =>
      agreementOnFile
        ? carrierIds.map(
            (carrierId) =>
              ({
                id: `agreement-${carrierId}`,
                carrierId,
                signedAt: new Date(),
                status: 'SIGNED',
              }) as Awaited<ReturnType<AgreementRepoPort['findManySigned']>>[number],
          )
        : [],
    ),
  };
  return { documentRepo, agreementRepo };
};

const TOTAL_PHASES = 6;
const allPhasesCompleted = Array.from({ length: TOTAL_PHASES }, (_, i) => i + 1);

const pastDate = new Date('2024-01-15');

const makeSession = (overrides: Partial<OnboardingSession> = {}): OnboardingSession => ({
  id: 'session-1',
  carrierId: 'carrier-1',
  currentPhase: TOTAL_PHASES,
  currentQuestionIndex: 0,
  currentStepId: null,
  completedPhases: allPhasesCompleted,
  // The complete() gate now keys off completedStepIds (the modern saga flow
  // writes this on every submitStep). 'sign-agreement' presence is the
  // authoritative signal that the wizard finished.
  completedStepIds: ['sign-agreement'],
  answers: {} as Prisma.JsonValue,
  completedAt: null,
  lastActiveAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeCarrier = (overrides: Partial<Carrier> = {}): Carrier =>
  ({
    id: 'carrier-1',
    name: 'Test Carrier',
    type: 'EXTERNAL_CARRIER',
    tin: '12-3456789',
    status: 'ONBOARDING',
    managedByOrgId: 'org-1',
    ...overrides,
  }) as Carrier;

const makeDeps = (compliance: ComplianceState = {}) => ({
  sessionRepo: {
    findByCarrierId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  carrierRepo: {
    findById: jest.fn(),
    update: jest.fn(),
  },
  eventBus: {
    publish: jest.fn().mockResolvedValue(undefined),
    publishDelayed: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue(undefined),
  },
  derivedComplianceDeps: buildDerivedComplianceDeps(compliance),
});

describe('onboardingSessionService.complete — document validation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is idempotent — returns existing session as-is when completedAt is already set', async () => {
    const deps = makeDeps();
    const alreadyComplete = makeSession({ completedAt: new Date('2026-05-20T10:00:00Z') });

    deps.sessionRepo.findByCarrierId.mockResolvedValue(alreadyComplete);

    const service = createOnboardingSessionService(deps);
    const result = await service.complete('carrier-1');

    expect(result.completedAt).toEqual(new Date('2026-05-20T10:00:00Z'));
    // No carrier read, no status transition, no audit write.
    expect(deps.carrierRepo.findById).not.toHaveBeenCalled();
    expect(deps.carrierRepo.update).not.toHaveBeenCalled();
    expect(deps.sessionRepo.update).not.toHaveBeenCalled();
  });

  it('completes session for EXTERNAL_CARRIER with all docs present and insurance valid', async () => {
    const deps = makeDeps();
    const session = makeSession();
    const carrier = makeCarrier();
    const updatedSession = makeSession({ completedAt: new Date() });

    deps.sessionRepo.findByCarrierId.mockResolvedValue(session);
    deps.carrierRepo.findById.mockResolvedValue(carrier);
    deps.sessionRepo.update.mockResolvedValue(updatedSession);
    deps.carrierRepo.update.mockResolvedValue(carrier);

    const service = createOnboardingSessionService(deps);
    const result = await service.complete('carrier-1');

    expect(result.completedAt).not.toBeNull();
    expect(deps.sessionRepo.update).toHaveBeenCalledWith('session-1', {
      completedAt: expect.any(Date),
    });
    expect(deps.carrierRepo.update).toHaveBeenCalledWith('carrier-1', {
      status: 'PENDING_APPROVAL',
    });
  });

  it('throws OnboardingBlockError for EXTERNAL_CARRIER missing insurance cert', async () => {
    const deps = makeDeps({ insuranceOnFile: false });
    const session = makeSession();
    const carrier = makeCarrier();

    deps.sessionRepo.findByCarrierId.mockResolvedValue(session);
    deps.carrierRepo.findById.mockResolvedValue(carrier);

    const service = createOnboardingSessionService(deps);

    await expect(service.complete('carrier-1')).rejects.toThrow(OnboardingBlockError);
    await expect(service.complete('carrier-1')).rejects.toThrow(
      expect.objectContaining({
        missingDocuments: expect.arrayContaining(['Certificate of Insurance']),
      }),
    );
  });

  it('throws OnboardingBlockError for EXTERNAL_CARRIER with expired insurance', async () => {
    const deps = makeDeps({ insuranceExpiry: pastDate });
    const session = makeSession();
    const carrier = makeCarrier();

    deps.sessionRepo.findByCarrierId.mockResolvedValue(session);
    deps.carrierRepo.findById.mockResolvedValue(carrier);

    const service = createOnboardingSessionService(deps);

    await expect(service.complete('carrier-1')).rejects.toThrow(OnboardingBlockError);
    await expect(service.complete('carrier-1')).rejects.toThrow(
      expect.objectContaining({
        missingDocuments: expect.arrayContaining([
          expect.stringContaining('expired'),
        ]),
      }),
    );
  });

  it('throws OnboardingBlockError for LEASED_CARRIER missing W9', async () => {
    const deps = makeDeps();
    const session = makeSession();
    const carrier = makeCarrier({
      type: 'LEASED_CARRIER',
      tin: null,
    });

    deps.sessionRepo.findByCarrierId.mockResolvedValue(session);
    deps.carrierRepo.findById.mockResolvedValue(carrier);

    const service = createOnboardingSessionService(deps);

    await expect(service.complete('carrier-1')).rejects.toThrow(OnboardingBlockError);
    await expect(service.complete('carrier-1')).rejects.toThrow(
      expect.objectContaining({
        missingDocuments: expect.arrayContaining(['W-9']),
      }),
    );
  });

  it('completes session for COMPANY_ASSET with no docs on file', async () => {
    // COMPANY_ASSET skips the document gate entirely, so derived compliance
    // state is irrelevant for this case.
    const deps = makeDeps({ insuranceOnFile: false, agreementOnFile: false });
    const session = makeSession();
    const carrier = makeCarrier({
      type: 'COMPANY_ASSET',
      tin: null,
    });
    const updatedSession = makeSession({ completedAt: new Date() });

    deps.sessionRepo.findByCarrierId.mockResolvedValue(session);
    deps.carrierRepo.findById.mockResolvedValue(carrier);
    deps.sessionRepo.update.mockResolvedValue(updatedSession);
    deps.carrierRepo.update.mockResolvedValue(carrier);

    const service = createOnboardingSessionService(deps);
    const result = await service.complete('carrier-1');

    expect(result.completedAt).not.toBeNull();
    expect(deps.sessionRepo.update).toHaveBeenCalledWith('session-1', {
      completedAt: expect.any(Date),
    });
    expect(deps.carrierRepo.update).toHaveBeenCalledWith('carrier-1', {
      status: 'PENDING_APPROVAL',
    });
  });
});
