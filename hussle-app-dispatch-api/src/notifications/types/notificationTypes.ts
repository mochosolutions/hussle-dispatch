import type {
  NotificationChannel,
  NotificationTrigger,
  CustomerNotificationSettings,
  LoadNotificationOverride,
  NotificationLog,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Re-export Prisma enums for convenience
// ---------------------------------------------------------------------------

export type { NotificationChannel, NotificationTrigger };

// ---------------------------------------------------------------------------
// Domain types derived from Prisma
// ---------------------------------------------------------------------------

export type NotificationSettingsRecord = CustomerNotificationSettings;

export type NotificationOverrideRecord = LoadNotificationOverride;

export type NotificationLogRecord = NotificationLog;

// ---------------------------------------------------------------------------
// Service input types
// ---------------------------------------------------------------------------

export interface UpsertNotificationSettingsInput {
  customerId: string;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  enabled: boolean;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
}

export interface UpsertNotificationOverrideInput {
  loadId: string;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  enabled: boolean;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  ccEmails?: string[];
}

export interface CreateNotificationLogInput {
  loadId: string;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  ccEmails?: string[];
  subject?: string | null;
  status?: string;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Resolved notification config (merged settings + overrides)
// ---------------------------------------------------------------------------

export interface ResolvedNotificationConfig {
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  enabled: boolean;
  recipientEmail: string | null;
  recipientPhone: string | null;
  ccEmails: string[];
}

// ---------------------------------------------------------------------------
// Notification content (rendered template output)
// ---------------------------------------------------------------------------

export interface NotificationContent {
  subject: string;
  html: string;
  smsBody: string;
}

// ---------------------------------------------------------------------------
// Notification context (data passed to templates)
// ---------------------------------------------------------------------------

export interface StatusChangeContext {
  loadNumber: string;
  fromStatus: string | null;
  toStatus: string;
  trackingUrl: string | null;
}

export interface CheckCallContext {
  loadNumber: string;
  location: string | null;
  status: string | null;
  eta: string | null;
  trackingUrl: string | null;
}
