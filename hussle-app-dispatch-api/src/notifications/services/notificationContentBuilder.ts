import type {
  NotificationContent,
  StatusChangeContext,
  CheckCallContext,
} from '../types/notificationTypes';
import {
  statusChangeEmailSubject,
  statusChangeEmailHtml,
} from '../templates/statusChangeEmail';
import { statusChangeSmsBody } from '../templates/statusChangeSms';
import {
  checkCallEmailSubject,
  checkCallEmailHtml,
} from '../templates/checkCallEmail';
import { checkCallSmsBody } from '../templates/checkCallSms';

export const buildStatusChangeContent = (ctx: StatusChangeContext): NotificationContent => ({
  subject: statusChangeEmailSubject(ctx),
  html: statusChangeEmailHtml(ctx),
  smsBody: statusChangeSmsBody(ctx),
});

export const buildCheckCallContent = (ctx: CheckCallContext): NotificationContent => ({
  subject: checkCallEmailSubject(ctx),
  html: checkCallEmailHtml(ctx),
  smsBody: checkCallSmsBody(ctx),
});
