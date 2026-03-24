import axiosInstance from 'utils/axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationSetting {
  id: string;
  customerId: string;
  trigger: string;
  channel: string;
  enabled: boolean;
  recipientEmail: string | null;
  recipientPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationOverride {
  id: string;
  loadId: string;
  trigger: string;
  channel: string;
  enabled: boolean;
  recipientEmail: string | null;
  recipientPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLogEntry {
  id: string;
  loadId: string;
  trigger: string;
  channel: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  subject: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export interface TrackingToken {
  id: string;
  loadId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface UpsertSettingInput {
  trigger: string;
  channel: string;
  enabled: boolean;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
}

export interface UpsertOverrideInput {
  trigger: string;
  channel: string;
  enabled: boolean;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
}

// ---------------------------------------------------------------------------
// Customer notification settings
// ---------------------------------------------------------------------------

export const getCustomerNotificationSettings = async (
  customerId: string,
): Promise<NotificationSetting[]> => {
  const response = await axiosInstance.get<{ data: NotificationSetting[] }>(
    `/notifications/customers/${customerId}/settings`,
  );
  return response.data.data;
};

export const upsertCustomerNotificationSetting = async (
  customerId: string,
  input: UpsertSettingInput,
): Promise<NotificationSetting> => {
  const response = await axiosInstance.put<{ data: NotificationSetting }>(
    `/notifications/customers/${customerId}/settings`,
    input,
  );
  return response.data.data;
};

export const bulkUpsertCustomerNotificationSettings = async (
  customerId: string,
  settings: UpsertSettingInput[],
): Promise<NotificationSetting[]> => {
  const response = await axiosInstance.put<{ data: NotificationSetting[] }>(
    `/notifications/customers/${customerId}/settings/bulk`,
    { settings },
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Load notification overrides
// ---------------------------------------------------------------------------

export const getLoadNotificationOverrides = async (
  loadId: string,
): Promise<NotificationOverride[]> => {
  const response = await axiosInstance.get<{ data: NotificationOverride[] }>(
    `/notifications/loads/${loadId}/overrides`,
  );
  return response.data.data;
};

export const upsertLoadNotificationOverride = async (
  loadId: string,
  input: UpsertOverrideInput,
): Promise<NotificationOverride> => {
  const response = await axiosInstance.put<{ data: NotificationOverride }>(
    `/notifications/loads/${loadId}/overrides`,
    input,
  );
  return response.data.data;
};

export const bulkUpsertLoadNotificationOverrides = async (
  loadId: string,
  overrides: UpsertOverrideInput[],
): Promise<NotificationOverride[]> => {
  const response = await axiosInstance.put<{ data: NotificationOverride[] }>(
    `/notifications/loads/${loadId}/overrides/bulk`,
    { overrides },
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Load notification history
// ---------------------------------------------------------------------------

export const getLoadNotificationHistory = async (
  loadId: string,
): Promise<NotificationLogEntry[]> => {
  const response = await axiosInstance.get<{ data: NotificationLogEntry[] }>(
    `/notifications/loads/${loadId}/history`,
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Tracking tokens
// ---------------------------------------------------------------------------

export const createTrackingToken = async (
  loadId: string,
): Promise<TrackingToken> => {
  const response = await axiosInstance.post<{ data: TrackingToken }>(
    `/notifications/loads/${loadId}/tracking-token`,
  );
  return response.data.data;
};
