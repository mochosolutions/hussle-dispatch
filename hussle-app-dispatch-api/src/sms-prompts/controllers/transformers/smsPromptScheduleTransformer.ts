import type { SmsPromptSchedule } from '@prisma/client';
import type {
  SmsPromptAnchorValue,
  SmsPromptStatusValue,
} from '../../types/smsPromptScheduleRepoPort';

export interface SmsPromptScheduleResponse {
  id: string;
  loadId: string;
  driverId: string;
  organizationId: string;
  anchor: SmsPromptAnchorValue;
  scheduledAt: string;
  status: SmsPromptStatusValue;
  sentAt: string | null;
  twilioMessageSid: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export const toSmsPromptScheduleResponse = (
  row: SmsPromptSchedule,
): SmsPromptScheduleResponse => ({
  id: row.id,
  loadId: row.loadId,
  driverId: row.driverId,
  organizationId: row.organizationId,
  anchor: row.anchor,
  scheduledAt: row.scheduledAt.toISOString(),
  status: row.status,
  sentAt: row.sentAt === null ? null : row.sentAt.toISOString(),
  twilioMessageSid: row.twilioMessageSid,
  failureReason: row.failureReason,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});
