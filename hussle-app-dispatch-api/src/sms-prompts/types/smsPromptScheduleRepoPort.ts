import type { SmsPromptSchedule } from '@prisma/client';

export type SmsPromptAnchorValue =
  | 'DISPATCHED'
  | 'PRE_PICKUP'
  | 'POST_PICKUP'
  | 'TRANSIT_INTERVAL'
  | 'MANUAL';

export type SmsPromptStatusValue = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELED';

export interface CreateSmsPromptInput {
  loadId: string;
  driverId: string;
  organizationId: string;
  anchor: SmsPromptAnchorValue;
  scheduledAt: Date;
}

export interface PaginationInput {
  skip: number;
  take: number;
}

export interface PaginatedSmsPromptSchedules {
  data: SmsPromptSchedule[];
  total: number;
}

export interface SmsPromptScheduleRepoPort {
  create(input: CreateSmsPromptInput): Promise<SmsPromptSchedule>;
  findById(id: string): Promise<SmsPromptSchedule | null>;
  findPending(
    loadId: string,
    anchor?: SmsPromptAnchorValue,
  ): Promise<SmsPromptSchedule[]>;
  cancel(ids: string[], reason: string): Promise<void>;
  markSent(
    id: string,
    twilioMessageSid: string | null,
    sentAt: Date,
  ): Promise<SmsPromptSchedule>;
  markFailed(id: string, failureReason: string): Promise<SmsPromptSchedule>;
  findByLoad(
    loadId: string,
    pagination: PaginationInput,
  ): Promise<PaginatedSmsPromptSchedules>;
  lastSentAtForLoad(loadId: string): Promise<Date | null>;
}
