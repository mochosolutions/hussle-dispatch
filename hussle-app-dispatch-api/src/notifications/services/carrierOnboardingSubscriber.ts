import type { EventBus } from '@/shared/messaging/eventBus';
import type { NotificationService } from '@/shared/notifications/notificationService';
import type { SmsService } from '@/shared/notifications/smsService';
import type { Logger } from '@/shared/utils/logger';
import {
  renderCarrierInviteEmail,
  renderCarrierOnboardingCompleteEmail,
  renderCarrierApprovedEmail,
  renderCarrierRejectedEmail,
} from '@hussle/emails';

const DEFAULT_FROM_EMAIL = 'notifications@hussle.app';
const QUEUE_GROUP = 'carrier-onboarding-notifications';

interface CarrierOnboardingSubscriberDeps {
  eventBus: EventBus;
  emailService: NotificationService;
  smsService: SmsService;
  logger: Logger;
  portalBaseUrl: string;
  frontendUrl: string;
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

    const { subject, html } = await renderCarrierInviteEmail({
      carrierName: data.carrierName,
      organizationName: data.organizationId,
      portalUrl,
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

    const { subject, html } = await renderCarrierOnboardingCompleteEmail({
      carrierName: data.carrierName,
      organizationName: data.organizationId,
      reviewUrl,
    });

    // TODO: Look up org admin email to send notification
    deps.logger.info('Carrier onboarding complete email rendered (not sent — no dispatcher email)', {
      carrierId: data.carrierId,
      subject,
      htmlLength: html.length,
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
