import type {
  NotificationContent,
  StatusChangeContext,
  CheckCallContext,
} from '../types/notificationTypes';
import { renderStatusChangeEmail, renderCheckCallEmail, renderInvitationEmail } from '@hussle/emails';
import { statusChangeSmsBody } from '../templates/statusChangeSms';
import { checkCallSmsBody } from '../templates/checkCallSms';

export const buildStatusChangeContent = async (
  ctx: StatusChangeContext,
): Promise<NotificationContent> => {
  const { subject, html } = await renderStatusChangeEmail({
    loadNumber: ctx.loadNumber,
    fromStatus: ctx.fromStatus,
    toStatus: ctx.toStatus,
    trackingUrl: ctx.trackingUrl,
  });

  return {
    subject,
    html,
    smsBody: statusChangeSmsBody(ctx),
  };
};

export const buildCheckCallContent = async (
  ctx: CheckCallContext,
): Promise<NotificationContent> => {
  const { subject, html } = await renderCheckCallEmail({
    loadNumber: ctx.loadNumber,
    location: ctx.location,
    status: ctx.status,
    eta: ctx.eta,
    trackingUrl: ctx.trackingUrl,
  });

  return {
    subject,
    html,
    smsBody: checkCallSmsBody(ctx),
  };
};

export interface InvitationContentContext {
  inviterName: string;
  orgName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
  inviteeName: string;
}

export const buildInvitationContent = async (
  ctx: InvitationContentContext,
): Promise<{ subject: string; html: string }> =>
  renderInvitationEmail({
    inviterName: ctx.inviterName,
    orgName: ctx.orgName,
    role: ctx.role,
    inviteUrl: ctx.inviteUrl,
    expiresAt: ctx.expiresAt,
    inviteeName: ctx.inviteeName,
  });
