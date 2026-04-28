import type { Carrier, OnboardingSession, Prisma } from '@prisma/client';
import { createOnboardingSessionService } from '../services/onboardingSessionService';
import { OnboardingBlockError } from '@/shared/errors/commonErrors';

const TOTAL_PHASES = 6;
const allPhasesCompleted = Array.from({ length: TOTAL_PHASES }, (_, i) => i + 1);

const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);

const pastDate = new Date('2024-01-15');

const makeSession = (overrides: Partial<OnboardingSession> = {}): OnboardingSession => ({
  id: 'session-1',
  carrierId: 'carrier-1',
  currentPhase: TOTAL_PHASES,
  currentQuestionIndex: 0,
  completedPhases: allPhasesCompleted,
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
    dispatchAgreementOnFile: true,
    insuranceCertOnFile: true,
    insuranceExpiry: futureDate,
    w9OnFile: true,
    onboardingStatus: 'IN_PROGRESS',
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
});

describe('onboardingSessionService.complete — document validation', () => {
  beforeEach(() => jest.clearAllMocks());

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
      onboardingStatus: 'COMPLETED',
    });
  });

  it('throws OnboardingBlockError for EXTERNAL_CARRIER missing insurance cert', async () => {
    const deps = makeDeps();
    const session = makeSession();
    const carrier = makeCarrier({
      insuranceCertOnFile: false,
      insuranceExpiry: null,
    });

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
    const deps = makeDeps();
    const session = makeSession();
    const carrier = makeCarrier({
      insuranceCertOnFile: true,
      insuranceExpiry: pastDate,
    });

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
      w9OnFile: false,
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
    const deps = makeDeps();
    const session = makeSession();
    const carrier = makeCarrier({
      type: 'COMPANY_ASSET',
      dispatchAgreementOnFile: false,
      insuranceCertOnFile: false,
      insuranceExpiry: null,
      w9OnFile: false,
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
      onboardingStatus: 'COMPLETED',
    });
  });
});
