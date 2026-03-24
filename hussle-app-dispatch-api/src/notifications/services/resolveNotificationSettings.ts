import type {
  NotificationSettingsRecord,
  NotificationOverrideRecord,
  ResolvedNotificationConfig,
  NotificationTrigger,
  NotificationChannel,
} from '../types/notificationTypes';

/**
 * Merges customer-level notification settings with per-load overrides.
 * Load overrides take precedence over customer defaults.
 * Returns the final list of resolved configs for a given trigger.
 */
export const resolveNotificationSettings = (
  customerSettings: NotificationSettingsRecord[],
  loadOverrides: NotificationOverrideRecord[],
  trigger: NotificationTrigger,
): ResolvedNotificationConfig[] => {
  const settingsForTrigger = customerSettings.filter((s) => s.trigger === trigger);

  const overrideMap = new Map<NotificationChannel, NotificationOverrideRecord>();
  loadOverrides
    .filter((o) => o.trigger === trigger)
    .forEach((o) => {
      overrideMap.set(o.channel, o);
    });

  const resolved: ResolvedNotificationConfig[] = [];

  // Process customer settings, applying overrides where they exist
  settingsForTrigger.forEach((setting) => {
    const override = overrideMap.get(setting.channel);

    if (override !== undefined) {
      resolved.push({
        trigger,
        channel: setting.channel,
        enabled: override.enabled,
        recipientEmail: override.recipientEmail ?? setting.recipientEmail,
        recipientPhone: override.recipientPhone ?? setting.recipientPhone,
      });
      overrideMap.delete(setting.channel);
    } else {
      resolved.push({
        trigger,
        channel: setting.channel,
        enabled: setting.enabled,
        recipientEmail: setting.recipientEmail,
        recipientPhone: setting.recipientPhone,
      });
    }
  });

  // Process any remaining overrides not matched to customer settings
  overrideMap.forEach((override) => {
    resolved.push({
      trigger,
      channel: override.channel,
      enabled: override.enabled,
      recipientEmail: override.recipientEmail,
      recipientPhone: override.recipientPhone,
    });
  });

  return resolved.filter((config) => config.enabled);
};
