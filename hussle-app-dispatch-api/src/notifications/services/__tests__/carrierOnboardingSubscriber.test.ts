jest.mock('@/shared/emails', () => ({
  renderCarrierInviteEmail: jest.fn().mockResolvedValue({
    subject: 'Carrier invite',
    html: '<p>Invite</p>',
  }),
  renderCarrierOnboardingCompleteEmail: jest.fn().mockResolvedValue({
    subject: 'Acme Trucking has completed onboarding',
    html: '<p>Onboarding complete</p>',
  }),
  renderCarrierApprovedEmail: jest.fn().mockResolvedValue({
    subject: 'Carrier approved',
    html: '<p>Approved</p>',
  }),
  renderCarrierRejectedEmail: jest.fn().mockResolvedValue({
    subject: 'Carrier rejected',
    html: '<p>Rejected</p>',
  }),
}));

import { initializeCarrierOnboardingSubscriber } from '../carrierOnboardingSubscriber';
import { renderCarrierOnboardingCompleteEmail } from '@/shared/emails';
import type { EventBus } from '@/shared/messaging/eventBus';

type Handler = (data: never) => Promise<void>;

const createMockDeps = () => {
  const handlers = new Map<string, Handler>();

  const eventBus: EventBus = {
    publish: jest.fn(),
    publishDelayed: jest.fn(),
    subscribe: jest.fn(async (event: string, _group: string, handler: Handler) => {
      handlers.set(event, handler);
    }),
    close: jest.fn(),
  };

  const emailService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };

  const smsService = {
    sendSms: jest.fn().mockResolvedValue(undefined),
  };

  const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const membershipQuery = {
    findAdminByOrgId: jest.fn(),
  };

  const organizationQuery = {
    findNameById: jest.fn(),
  };

  const invokeHandler = async (event: string, data: unknown): Promise<void> => {
    const handler = handlers.get(event);
    expect(handler).toBeDefined();
    await (handler as Handler)(data as never);
  };

  return {
    deps: {
      eventBus,
      emailService,
      smsService,
      logger,
      portalBaseUrl: 'https://portal.hussle.app',
      frontendUrl: 'https://app.hussle.app',
      membershipQuery,
      organizationQuery,
    },
    invokeHandler,
  };
};

describe('carrierOnboardingSubscriber — carrier.onboarding.completed', () => {
  beforeEach(() => jest.clearAllMocks());

  const completedEvent = {
    carrierId: 'carrier-1',
    organizationId: 'org-1',
    carrierName: 'Acme Trucking',
  };

  it('sends email to admin when admin exists', async () => {
    const { deps, invokeHandler } = createMockDeps();

    deps.membershipQuery.findAdminByOrgId.mockResolvedValue({
      email: 'admin@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    deps.organizationQuery.findNameById.mockResolvedValue({
      name: 'Fleet Corp',
    });

    await initializeCarrierOnboardingSubscriber(deps);
    await invokeHandler('carrier.onboarding.completed', completedEvent);

    expect(deps.membershipQuery.findAdminByOrgId).toHaveBeenCalledWith('org-1');
    expect(deps.organizationQuery.findNameById).toHaveBeenCalledWith('org-1');

    expect(deps.emailService.sendEmail).toHaveBeenCalledWith({
      to: 'admin@example.com',
      from: 'notifications@hussle.app',
      subject: 'Acme Trucking has completed onboarding',
      html: '<p>Onboarding complete</p>',
    });
  });

  it('passes actual organization name to email renderer, not ID', async () => {
    const { deps, invokeHandler } = createMockDeps();

    deps.membershipQuery.findAdminByOrgId.mockResolvedValue({
      email: 'admin@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    deps.organizationQuery.findNameById.mockResolvedValue({
      name: 'Fleet Corp',
    });

    await initializeCarrierOnboardingSubscriber(deps);
    await invokeHandler('carrier.onboarding.completed', completedEvent);

    expect(renderCarrierOnboardingCompleteEmail).toHaveBeenCalledWith({
      carrierName: 'Acme Trucking',
      organizationName: 'Fleet Corp',
      reviewUrl: 'https://app.hussle.app/carriers/carrier-1?tab=onboarding',
    });
  });

  it('uses fallback organization name when org not found', async () => {
    const { deps, invokeHandler } = createMockDeps();

    deps.membershipQuery.findAdminByOrgId.mockResolvedValue({
      email: 'admin@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    deps.organizationQuery.findNameById.mockResolvedValue(null);

    await initializeCarrierOnboardingSubscriber(deps);
    await invokeHandler('carrier.onboarding.completed', completedEvent);

    expect(renderCarrierOnboardingCompleteEmail).toHaveBeenCalledWith(
      expect.objectContaining({ organizationName: 'Your Organization' }),
    );

    expect(deps.emailService.sendEmail).toHaveBeenCalled();
  });

  it('logs warning and does not send email when no admin found', async () => {
    const { deps, invokeHandler } = createMockDeps();

    deps.membershipQuery.findAdminByOrgId.mockResolvedValue(null);

    await initializeCarrierOnboardingSubscriber(deps);
    await invokeHandler('carrier.onboarding.completed', completedEvent);

    expect(deps.logger.warn).toHaveBeenCalledWith(
      'No admin found for organization — onboarding complete email not sent',
      expect.objectContaining({
        carrierId: 'carrier-1',
        organizationId: 'org-1',
      }),
    );

    expect(deps.emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('does not throw when no admin found', async () => {
    const { deps, invokeHandler } = createMockDeps();

    deps.membershipQuery.findAdminByOrgId.mockResolvedValue(null);

    await initializeCarrierOnboardingSubscriber(deps);

    await expect(
      invokeHandler('carrier.onboarding.completed', completedEvent),
    ).resolves.toBeUndefined();
  });
});
