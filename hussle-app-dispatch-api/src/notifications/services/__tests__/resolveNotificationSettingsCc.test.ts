import { resolveNotificationSettings } from '../resolveNotificationSettings';
import type {
  NotificationSettingsRecord,
  NotificationOverrideRecord,
} from '../../types/notificationTypes';

const makeSettings = (
  overrides: Partial<NotificationSettingsRecord> = {},
): NotificationSettingsRecord => ({
  id: 'settings-1',
  customerId: 'customer-1',
  trigger: 'STATUS_CHANGE',
  channel: 'EMAIL',
  enabled: true,
  recipientEmail: 'default@example.com',
  recipientPhone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeOverride = (
  overrides: Partial<NotificationOverrideRecord> = {},
): NotificationOverrideRecord => ({
  id: 'override-1',
  loadId: 'load-1',
  trigger: 'STATUS_CHANGE',
  channel: 'EMAIL',
  enabled: true,
  recipientEmail: null,
  recipientPhone: null,
  ccEmails: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('resolveNotificationSettings CC emails', () => {
  it('includes override ccEmails when override exists', () => {
    const settings = [makeSettings()];
    const overrides = [makeOverride({ ccEmails: ['cc1@example.com', 'cc2@example.com'] })];

    const result = resolveNotificationSettings(settings, overrides, 'STATUS_CHANGE');

    expect(result).toHaveLength(1);
    expect(result[0]?.ccEmails).toEqual(['cc1@example.com', 'cc2@example.com']);
  });

  it('returns empty ccEmails when no override exists', () => {
    const settings = [makeSettings()];

    const result = resolveNotificationSettings(settings, [], 'STATUS_CHANGE');

    expect(result).toHaveLength(1);
    expect(result[0]?.ccEmails).toEqual([]);
  });

  it('uses override ccEmails even when override recipientEmail is null', () => {
    const settings = [makeSettings({ recipientEmail: 'default@example.com' })];
    const overrides = [
      makeOverride({ recipientEmail: null, ccEmails: ['cc@example.com'] }),
    ];

    const result = resolveNotificationSettings(settings, overrides, 'STATUS_CHANGE');

    expect(result).toHaveLength(1);
    expect(result[0]?.recipientEmail).toBe('default@example.com');
    expect(result[0]?.ccEmails).toEqual(['cc@example.com']);
  });
});
