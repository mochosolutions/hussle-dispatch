import type { LoadNotificationOverrideRepoPort } from '../types/notificationRepoPort';
import type {
  NotificationOverrideRecord,
  UpsertNotificationOverrideInput,
} from '../types/notificationTypes';

export interface LoadNotificationOverrideService {
  getByLoadId(loadId: string, organizationId: string): Promise<NotificationOverrideRecord[]>;
  upsert(input: UpsertNotificationOverrideInput): Promise<NotificationOverrideRecord>;
  bulkUpsert(inputs: UpsertNotificationOverrideInput[]): Promise<NotificationOverrideRecord[]>;
}

interface LoadNotificationOverrideServiceDeps {
  overrideRepo: LoadNotificationOverrideRepoPort;
}

export const createLoadNotificationOverrideService = (
  deps: LoadNotificationOverrideServiceDeps,
): LoadNotificationOverrideService => ({
  getByLoadId: async (loadId, organizationId) =>
    deps.overrideRepo.findByLoadId(loadId, organizationId),

  upsert: async (input) =>
    deps.overrideRepo.upsert(input),

  bulkUpsert: async (inputs) => {
    const results: NotificationOverrideRecord[] = [];
    for (const input of inputs) {
      const result = await deps.overrideRepo.upsert(input);
      results.push(result);
    }
    return results;
  },
});
