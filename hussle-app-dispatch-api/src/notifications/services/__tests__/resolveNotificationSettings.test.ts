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
  recipientEmail: 'broker@example.com',
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
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const first = <T,>(arr: T[]): T => {
  expect(arr.length).toBeGreaterThan(0);
  return arr[0] as T;
};

describe('resolveNotificationSettings', () => {
  it('returns customer settings when no overrides exist', () => {
    const settings = [makeSettings()];
    const result = resolveNotificationSettings(settings, [], 'STATUS_CHANGE');

    expect(result).toHaveLength(1);
    expect(first(result).channel).toBe('EMAIL');
    expect(first(result).recipientEmail).toBe('broker@example.com');
  });

  it('filters by trigger', () => {
    const settings = [
      makeSettings({ trigger: 'STATUS_CHANGE' }),
      makeSettings({ id: 's2', trigger: 'CHECK_CALL', channel: 'SMS' }),
    ];
    const result = resolveNotificationSettings(settings, [], 'STATUS_CHANGE');

    expect(result).toHaveLength(1);
    expect(first(result).trigger).toBe('STATUS_CHANGE');
  });

  it('override disables a customer setting', () => {
    const settings = [makeSettings()];
    const overrides = [makeOverride({ enabled: false })];

    const result = resolveNotificationSettings(settings, overrides, 'STATUS_CHANGE');

    expect(result).toHaveLength(0);
  });

  it('override changes recipient email', () => {
    const settings = [makeSettings()];
    const overrides = [makeOverride({ recipientEmail: 'override@example.com' })];

    const result = resolveNotificationSettings(settings, overrides, 'STATUS_CHANGE');

    expect(result).toHaveLength(1);
    expect(first(result).recipientEmail).toBe('override@example.com');
  });

  it('override with null email falls back to customer setting email', () => {
    const settings = [makeSettings({ recipientEmail: 'default@example.com' })];
    const overrides = [makeOverride({ recipientEmail: null })];

    const result = resolveNotificationSettings(settings, overrides, 'STATUS_CHANGE');

    expect(result).toHaveLength(1);
    expect(first(result).recipientEmail).toBe('default@example.com');
  });

  it('includes overrides that add new channels not in customer settings', () => {
    const settings = [makeSettings({ channel: 'EMAIL' })];
    const overrides = [
      makeOverride({
        channel: 'SMS',
        recipientPhone: '+15551234567',
      }),
    ];

    const result = resolveNotificationSettings(settings, overrides, 'STATUS_CHANGE');

    expect(result).toHaveLength(2);
    const smsConfig = result.find((c) => c.channel === 'SMS');
    expect(smsConfig).toBeDefined();
    expect(smsConfig?.recipientPhone).toBe('+15551234567');
  });

  it('filters out disabled settings', () => {
    const settings = [makeSettings({ enabled: false })];
    const result = resolveNotificationSettings(settings, [], 'STATUS_CHANGE');

    expect(result).toHaveLength(0);
  });

  it('handles both email and SMS customer settings', () => {
    const settings = [
      makeSettings({ channel: 'EMAIL' }),
      makeSettings({ id: 's2', channel: 'SMS', recipientPhone: '+15551234567' }),
    ];

    const result = resolveNotificationSettings(settings, [], 'STATUS_CHANGE');

    expect(result).toHaveLength(2);
  });

  it('returns empty array when no settings match the trigger', () => {
    const settings = [makeSettings({ trigger: 'CHECK_CALL' })];
    const result = resolveNotificationSettings(settings, [], 'STATUS_CHANGE');

    expect(result).toHaveLength(0);
  });
});
