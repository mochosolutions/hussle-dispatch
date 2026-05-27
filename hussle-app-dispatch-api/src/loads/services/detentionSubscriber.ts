import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

interface DetentionSubscriberDeps {
  eventBus: EventBus;
  logger: Logger;
}

/**
 * Subscribes to load.detention.detected events and logs detention alerts.
 *
 * NOTE: Currently logs to the application logger. When in-app notifications
 * for dispatchers are built, wire this to the notification delivery system.
 */
export const initializeDetentionSubscriber = async (
  deps: DetentionSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('load.detention.detected', 'loads-detention-alerts', async (data) => {
    const location = data.facilityName ?? [data.city, data.state].filter(Boolean).join(', ') ?? 'Unknown';

    deps.logger.info(
      `Detention detected on Load ${data.loadNumber} at ${location}: ${String(data.waitHours.toFixed(1))}hr wait, ${String(data.billableHours)}hr billed at $${String(data.rate)}/hr = $${String(data.amount)}`,
      {
        loadId: data.loadId,
        organizationId: data.organizationId,
        loadNumber: data.loadNumber,
        stopId: data.stopId,
        stopSequence: data.stopSequence,
        waitHours: data.waitHours,
        billableHours: data.billableHours,
        rate: data.rate,
        amount: data.amount,
      },
    );
  });
};
