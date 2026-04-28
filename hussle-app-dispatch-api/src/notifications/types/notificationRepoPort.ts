import type {
  NotificationSettingsRecord,
  NotificationOverrideRecord,
  NotificationLogRecord,
  UpsertNotificationSettingsInput,
  UpsertNotificationOverrideInput,
  CreateNotificationLogInput,
} from './notificationTypes';

export interface NotificationSettingsRepoPort {
  findByCustomerId(customerId: string): Promise<NotificationSettingsRecord[]>;
  upsert(input: UpsertNotificationSettingsInput): Promise<NotificationSettingsRecord>;
  deleteByCustomerIdAndTriggerChannel(
    customerId: string,
    trigger: string,
    channel: string,
  ): Promise<void>;
}

export interface LoadNotificationOverrideRepoPort {
  findByLoadId(loadId: string, organizationId: string): Promise<NotificationOverrideRecord[]>;
  upsert(input: UpsertNotificationOverrideInput): Promise<NotificationOverrideRecord>;
  deleteByLoadIdAndTriggerChannel(
    loadId: string,
    trigger: string,
    channel: string,
  ): Promise<void>;
}

export interface NotificationLogRepoPort {
  create(input: CreateNotificationLogInput): Promise<NotificationLogRecord>;
  findByLoadId(loadId: string, organizationId: string): Promise<NotificationLogRecord[]>;
}
