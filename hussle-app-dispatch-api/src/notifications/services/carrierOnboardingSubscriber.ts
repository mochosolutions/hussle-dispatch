import type { EventBus } from '@/shared/messaging/eventBus';
import type { NotificationService } from '@/shared/notifications/notificationService';
import type { SmsService } from '@/shared/notifications/smsService';
import type { Logger } from '@/shared/utils/logger';
import {
  renderCarrierInviteEmail,
  renderCarrierOnboardingCompleteEmail,
  renderCarrierApprovedEmail,
  renderCarrierRejectedEmail,
} from '@/shared/emails';
import { REQUIRED_CARRIER_DOCUMENTS } from '@/shared/constants/requiredCarrierDocuments';

const DEFAULT_FROM_EMAIL = 'notifications@hussle.app';
const QUEUE_GROUP = 'carrier-onboarding-notifications';

interface AdminInfo {
  email: string;
  firstName: string;
  lastName: string;
}

interface OrgInfo {
  name: string;
}

interface CarrierOnboardingSubscriberDeps {
  eventBus: EventBus;
  emailService: NotificationService;
  smsService: SmsService;
  logger: Logger;
  portalBaseUrl: string;
  frontendUrl: string;
  membershipQuery: {
    findAdminByOrgId: (organizationId: string) => Promise<AdminInfo | null>;
  };
  organizationQuery: {
    findNameById: (organizationId: string) => Promise<OrgInfo | null>;
  };
}

export const initializeCarrierOnboardingSubscriber = async (
  deps: CarrierOnboardingSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('carrier.invited', QUEUE_GROUP, async (data) => {
    const portalUrl = `${deps.portalBaseUrl}/carrier-portal/${data.inviteToken}`;

    deps.logger.info('Processing carrier.invited event', {
      carrierId: data.carrierId,
      organizationId: data.organizationId,
    });

    const org = await deps.organizationQuery.findNameById(data.organizationId);
    const organizationName = org?.name ?? 'Your Organization';

    const { subject, html } = await renderCarrierInviteEmail({
      carrierName: data.carrierName,
      organizationName,
      portalUrl,
      documents: REQUIRED_CARRIER_DOCUMENTS,
    });

    await deps.emailService.sendEmail({
      to: data.carrierEmail,
      from: DEFAULT_FROM_EMAIL,
      subject,
      html,
    });

    deps.logger.info('Carrier invite email sent', {
      carrierId: data.carrierId,
      carrierEmail: data.carrierEmail,
    });

    if (data.carrierPhone) {
      await deps.smsService.sendSms({
        to: data.carrierPhone,
        body: `You've been invited to onboard as a carrier. Complete your profile here: ${portalUrl}`,
      });

      deps.logger.info('Carrier invite SMS sent', {
        carrierId: data.carrierId,
      });
    }
  });

  await deps.eventBus.subscribe('carrier.onboarding.completed', QUEUE_GROUP, async (data) => {
    const reviewUrl = `${deps.frontendUrl}/carriers/${data.carrierId}?tab=onboarding`;

    deps.logger.info('Processing carrier.onboarding.completed event', {
      carrierId: data.carrierId,
      organizationId: data.organizationId,
    });

    const admin = await deps.membershipQuery.findAdminByOrgId(data.organizationId);

    if (!admin) {
      deps.logger.warn('No admin found for organization — onboarding complete email not sent', {
        carrierId: data.carrierId,
        organizationId: data.organizationId,
      });
      return;
    }

    const org = await deps.organizationQuery.findNameById(data.organizationId);
    const organizationName = org?.name ?? 'Your Organization';

    const { subject, html } = await renderCarrierOnboardingCompleteEmail({
      carrierName: data.carrierName,
      organizationName,
      reviewUrl,
    });

    await deps.emailService.sendEmail({
      to: admin.email,
      from: DEFAULT_FROM_EMAIL,
      subject,
      html,
    });

    deps.logger.info('Carrier onboarding complete email sent', {
      carrierId: data.carrierId,
      adminEmail: admin.email,
    });
  });

  await deps.eventBus.subscribe('carrier.onboarding.approved', QUEUE_GROUP, async (data) => {
    deps.logger.info('Processing carrier.onboarding.approved event', {
      carrierId: data.carrierId,
      organizationId: data.organizationId,
    });

    const { subject, html } = await renderCarrierApprovedEmail({
      carrierName: data.carrierName,
      organizationName: data.organizationId,
    });

    await deps.emailService.sendEmail({
      to: data.carrierEmail,
      from: DEFAULT_FROM_EMAIL,
      subject,
      html,
    });

    deps.logger.info('Carrier approved email sent', {
      carrierId: data.carrierId,
      carrierEmail: data.carrierEmail,
    });

    if (data.carrierPhone) {
      await deps.smsService.sendSms({
        to: data.carrierPhone,
        body: `Congratulations! You've been approved as a carrier with ${data.organizationId}. You can now receive load dispatches.`,
      });

      deps.logger.info('Carrier approved SMS sent', {
        carrierId: data.carrierId,
      });
    }
  });

  await deps.eventBus.subscribe('carrier.onboarding.rejected', QUEUE_GROUP, async (data) => {
    deps.logger.info('Processing carrier.onboarding.rejected event', {
      carrierId: data.carrierId,
      organizationId: data.organizationId,
    });

    const { subject, html } = await renderCarrierRejectedEmail({
      carrierName: data.carrierName,
      organizationName: data.organizationId,
      rejectionReason: data.rejectionReason,
    });

    await deps.emailService.sendEmail({
      to: data.carrierEmail,
      from: DEFAULT_FROM_EMAIL,
      subject,
      html,
    });

    deps.logger.info('Carrier rejected email sent', {
      carrierId: data.carrierId,
      carrierEmail: data.carrierEmail,
    });

    if (data.carrierPhone) {
      await deps.smsService.sendSms({
        to: data.carrierPhone,
        body: 'Update on your carrier application: Unfortunately your application was not approved at this time. Please check your email for details.',
      });

      deps.logger.info('Carrier rejected SMS sent', {
        carrierId: data.carrierId,
      });
    }
  });

  deps.logger.info('Carrier onboarding subscriber initialized');
};
