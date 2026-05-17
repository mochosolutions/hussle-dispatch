import type { Carrier, OnboardingSession, Prisma } from '@prisma/client';
import { createOnboardingSessionService } from '../onboardingSessionService';
import { FieldLockedError, NotFoundError } from '@/shared/errors/commonErrors';

const futureDate = new Date('2099-01-01');

const makeSession = (overrides: Partial<OnboardingSession> = {}): OnboardingSession =>
  ({
    id: 'session-1',
    carrierId: 'carrier-1',
    currentPhase: 1,
    currentQuestionIndex: 0,
    currentStepId: null,
    completedPhases: [],
    completedStepIds: [],
    answers: {} as Prisma.JsonValue,
    completedAt: null,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as OnboardingSession;

const makeCarrier = (overrides: Partial<Carrier> = {}): Carrier =>
  ({
    id: 'carrier-1',
    name: 'Acme Logistics LLC',
    legalName: 'Acme Logistics LLC',
    type: 'EXTERNAL_CARRIER',
    dispatchAgreementOnFile: false,
    dispatchAgreementSignedAt: null,
    insuranceCertOnFile: true,
    insuranceExpiry: futureDate,
    tin: null,
    status: 'ONBOARDING',
    managedByOrgId: 'org-1',
    ...overrides,
  }) as Carrier;

const makeDeps = () => ({
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
});

describe('onboardingSessionService.submitStep', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundError when session does not exist', async () => {
    const deps = makeDeps();
    deps.sessionRepo.findByCarrierId.mockResolvedValue(null);
    const service = createOnboardingSessionService(deps);

    await expect(
      service.submitStep('carrier-1', { stepId: 'welcome-segmentation', answers: {} }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('persists answers under session.answers[stepId], advances currentStepId, appends completedStepIds', async () => {
    const deps = makeDeps();
    const session = makeSession();
    deps.sessionRepo.findByCarrierId.mockResolvedValue(session);
    deps.carrierRepo.findById.mockResolvedValue(makeCarrier());
    deps.sessionRepo.update.mockImplementation(async (_id: string, data: Record<string, unknown>) => ({
      ...session,
      ...data,
    }) as OnboardingSession);

    const service = createOnboardingSessionService(deps);
    await service.submitStep('carrier-1', {
      stepId: 'welcome-segmentation',
      answers: { carrier_type: 'owner-operator' },
    });

    expect(deps.sessionRepo.update).toHaveBeenCalledWith('session-1', expect.objectContaining({
      currentStepId: 'welcome-segmentation',
      completedStepIds: ['welcome-segmentation'],
      answers: expect.objectContaining({
        'welcome-segmentation': { carrier_type: 'owner-operator' },
      }),
    }));
  });

  it('does not duplicate stepId in completedStepIds on re-submit', async () => {
    const deps = makeDeps();
    const session = makeSession({
      completedStepIds: ['welcome-segmentation'],
    });
    deps.sessionRepo.findByCarrierId.mockResolvedValue(session);
    deps.carrierRepo.findById.mockResolvedValue(makeCarrier());
    deps.sessionRepo.update.mockResolvedValue(session);

    const service = createOnboardingSessionService(deps);
    await service.submitStep('carrier-1', {
      stepId: 'welcome-segmentation',
      answers: { carrier_type: 'owner-operator' },
    });

    const updateArgs = (deps.sessionRepo.update.mock.calls[0] as unknown as [string, Record<string, unknown>])[1];
    expect(updateArgs.completedStepIds).toEqual(['welcome-segmentation']);
  });

  it('rejects locked-field mutation with FieldLockedError when dispatchAgreementSignedAt is set', async () => {
    const deps = makeDeps();
    const session = makeSession({
      answers: { 'company-confirm': { legalName: 'Acme Logistics LLC' } } as Prisma.JsonValue,
    });
    deps.sessionRepo.findByCarrierId.mockResolvedValue(session);
    deps.carrierRepo.findById.mockResolvedValue(
      makeCarrier({ dispatchAgreementSignedAt: new Date('2026-01-01') }),
    );

    const service = createOnboardingSessionService(deps);

    await expect(
      service.submitStep('carrier-1', {
        stepId: 'company-confirm',
        answers: { legalName: 'New Legal Name' },
      }),
    ).rejects.toBeInstanceOf(FieldLockedError);

    expect(deps.sessionRepo.update).not.toHaveBeenCalled();
  });

  it('allows unchanged locked-field values after signing (idempotent)', async () => {
    const deps = makeDeps();
    const session = makeSession({
      answers: { 'company-confirm': { legalName: 'Acme Logistics LLC' } } as Prisma.JsonValue,
    });
    deps.sessionRepo.findByCarrierId.mockResolvedValue(session);
    deps.carrierRepo.findById.mockResolvedValue(
      makeCarrier({ dispatchAgreementSignedAt: new Date('2026-01-01') }),
    );
    deps.sessionRepo.update.mockResolvedValue(session);

    const service = createOnboardingSessionService(deps);

    await expect(
      service.submitStep('carrier-1', {
        stepId: 'company-confirm',
        answers: { legalName: 'Acme Logistics LLC' },
      }),
    ).resolves.toBeDefined();
  });

  it('does not enforce locks for non-company steps', async () => {
    const deps = makeDeps();
    const session = makeSession();
    deps.sessionRepo.findByCarrierId.mockResolvedValue(session);
    deps.carrierRepo.findById.mockResolvedValue(
      makeCarrier({ dispatchAgreementSignedAt: new Date('2026-01-01') }),
    );
    deps.sessionRepo.update.mockResolvedValue(session);

    const service = createOnboardingSessionService(deps);

    await expect(
      service.submitStep('carrier-1', {
        stepId: 'cost-analysis',
        answers: { fixedTotal: 5000 },
      }),
    ).resolves.toBeDefined();
  });
});
