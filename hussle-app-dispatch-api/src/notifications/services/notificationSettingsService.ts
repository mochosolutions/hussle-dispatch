import type { NotificationSettingsRepoPort } from '../types/notificationRepoPort';
import type {
  NotificationSettingsRecord,
  UpsertNotificationSettingsInput,
} from '../types/notificationTypes';

export interface NotificationSettingsService {
  getByCustomerId(customerId: string): Promise<NotificationSettingsRecord[]>;
  upsert(input: UpsertNotificationSettingsInput): Promise<NotificationSettingsRecord>;
  bulkUpsert(inputs: UpsertNotificationSettingsInput[]): Promise<NotificationSettingsRecord[]>;
}

interface NotificationSettingsServiceDeps {
  settingsRepo: NotificationSettingsRepoPort;
}

export const createNotificationSettingsService = (
  deps: NotificationSettingsServiceDeps,
): NotificationSettingsService => ({
  getByCustomerId: async (customerId) =>
    deps.settingsRepo.findByCustomerId(customerId),

  upsert: async (input) =>
    deps.settingsRepo.upsert(input),

  bulkUpsert: async (inputs) => {
    const results: NotificationSettingsRecord[] = [];
    for (const input of inputs) {
      const result = await deps.settingsRepo.upsert(input);
      results.push(result);
    }
    return results;
  },
});
