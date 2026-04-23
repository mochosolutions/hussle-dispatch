import type { EventBus } from '@/shared/messaging/eventBus';
import type { EventMap } from '@/shared/messaging/eventMap';
import type { Logger } from '@/shared/utils/logger';
import type { SettingsRepoPort } from '@/settings/types/settingsTypes';
import type {
  SmsPromptScheduleRepoPort,
  SmsPromptAnchorValue,
} from '../types/smsPromptScheduleRepoPort';
import type {
  LoadForScheduling,
  LoadSchedulerQueryPort,
  LoadSchedulerStop,
} from '../types/loadSchedulerQueryPort';
import { resolveSmsSettings, type ResolvedSmsSettings } from './resolveSmsSettings';

const QUEUE_GROUP = 'sms-prompts-service';

const POST_PICKUP_CAP_MS = 48 * 60 * 60 * 1000; // 48h

const SHORT_TRANSIT_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4h

const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELED', 'TONU']);

export interface SmsPromptSchedulerSubscriberDeps {
  eventBus: EventBus;
  scheduleRepo: SmsPromptScheduleRepoPort;
  loadRepo: LoadSchedulerQueryPort;
  settingsRepo: SettingsRepoPort;
  logger: Logger;
}

/**
 * Internal context shared across seeding helpers so deps / settings / driver id
 * don't have to be threaded through every call.
 */
interface SeedContext {
  load: LoadForScheduling;
  driverId: string;
  settings: ResolvedSmsSettings;
}

const findFirstPickupStop = (
  stops: LoadSchedulerStop[],
): LoadSchedulerStop | null => {
  const pickups = stops
    .filter((stop) => stop.type === 'PICKUP')
    .sort((a, b) => a.sequence - b.sequence);
  return pickups[0] ?? null;
};

const findLastDeliveryStop = (
  stops: LoadSchedulerStop[],
): LoadSchedulerStop | null => {
  const deliveries = stops
    .filter((stop) => stop.type === 'DELIVERY')
    .sort((a, b) => b.sequence - a.sequence);
  return deliveries[0] ?? null;
};

/**
 * Creates a SmsPromptSchedule row and enqueues the corresponding delayed
 * `sms.prompt.due` event. Publishing is wrapped in .catch so an event-bus
 * failure doesn't leave the caller dangling.
 */
const scheduleRow = async (
  deps: SmsPromptSchedulerSubscriberDeps,
  input: {
    loadId: string;
    driverId: string;
    organizationId: string;
    anchor: SmsPromptAnchorValue;
    scheduledAt: Date;
  },
): Promise<void> => {
  const row = await deps.scheduleRepo.create({
    loadId: input.loadId,
    driverId: input.driverId,
    organizationId: input.organizationId,
    anchor: input.anchor,
    scheduledAt: input.scheduledAt,
  });

  const delayMs = Math.max(0, input.scheduledAt.getTime() - Date.now());

  await deps.eventBus
    .publishDelayed(
      'sms.prompt.due',
      {
        smsPromptScheduleId: row.id,
        loadId: input.loadId,
        organizationId: input.organizationId,
        anchor: input.anchor,
      },
      delayMs,
    )
    .catch((error: unknown) => {
      deps.logger.error('Failed to enqueue sms.prompt.due event', {
        error: error instanceof Error ? error.message : String(error),
        smsPromptScheduleId: row.id,
        loadId: input.loadId,
      });
    });
};

interface CancelByAnchorInput {
  loadId: string;
  anchor: SmsPromptAnchorValue;
  reason: string;
}

const cancelPendingByAnchor = async (
  input: CancelByAnchorInput,
  deps: SmsPromptSchedulerSubscriberDeps,
): Promise<void> => {
  const { loadId, anchor, reason } = input;
  const rows = await deps.scheduleRepo.findPending(loadId, anchor);
  if (rows.length === 0) {
    return;
  }
  await deps.scheduleRepo.cancel(
    rows.map((row) => row.id),
    reason,
  );
  for (const row of rows) {
    await deps.eventBus
      .publish('sms.prompt.canceled', {
        smsPromptScheduleId: row.id,
        loadId,
        reason,
      })
      .catch((error: unknown) => {
        deps.logger.error('Failed to publish sms.prompt.canceled', {
          error: error instanceof Error ? error.message : String(error),
          smsPromptScheduleId: row.id,
        });
      });
  }
};

const cancelAllPending = async (
  loadId: string,
  reason: string,
  deps: SmsPromptSchedulerSubscriberDeps,
): Promise<void> => {
  const rows = await deps.scheduleRepo.findPending(loadId);
  if (rows.length === 0) {
    return;
  }
  await deps.scheduleRepo.cancel(
    rows.map((row) => row.id),
    reason,
  );
  for (const row of rows) {
    await deps.eventBus
      .publish('sms.prompt.canceled', {
        smsPromptScheduleId: row.id,
        loadId,
        reason,
      })
      .catch((error: unknown) => {
        deps.logger.error('Failed to publish sms.prompt.canceled', {
          error: error instanceof Error ? error.message : String(error),
          smsPromptScheduleId: row.id,
        });
      });
  }
};

const loadSeedContext = async (
  loadId: string,
  deps: SmsPromptSchedulerSubscriberDeps,
): Promise<SeedContext | null> => {
  const load = await deps.loadRepo.findForScheduling(loadId);
  if (load === null) {
    deps.logger.warn('Load not found while seeding SMS prompts', { loadId });
    return null;
  }
  if (load.driverId === null) {
    deps.logger.warn('Skipping SMS prompt seeding — load has no driver', {
      loadId,
    });
    return null;
  }
  const settingsRow = await deps.settingsRepo.findByOrganizationId(
    load.organizationId,
  );
  const settings = resolveSmsSettings(settingsRow);
  return { load, driverId: load.driverId, settings };
};

const seedDispatchedPrompts = async (
  loadId: string,
  deps: SmsPromptSchedulerSubscriberDeps,
): Promise<void> => {
  const ctx = await loadSeedContext(loadId, deps);
  if (ctx === null) {
    return;
  }
  const { load, driverId, settings } = ctx;
  const now = new Date();

  // DISPATCHED — fires immediately.
  await scheduleRow(deps, {
    loadId,
    driverId,
    organizationId: load.organizationId,
    anchor: 'DISPATCHED',
    scheduledAt: now,
  });

  const firstPickup = findFirstPickupStop(load.stops);

  if (firstPickup?.appointmentStart) {
    const prePickupAt = new Date(
      firstPickup.appointmentStart.getTime() -
        settings.prePickupLeadMinutes * 60 * 1000,
    );
    if (prePickupAt.getTime() > now.getTime()) {
      await scheduleRow(deps, {
        loadId,
        driverId,
        organizationId: load.organizationId,
        anchor: 'PRE_PICKUP',
        scheduledAt: prePickupAt,
      });
    } else {
      deps.logger.info('Skipping PRE_PICKUP — scheduled time is in the past', {
        loadId,
        appointmentStart: firstPickup.appointmentStart.toISOString(),
      });
    }
  } else {
    deps.logger.info(
      'Skipping PRE_PICKUP — first pickup has no appointmentStart',
      { loadId },
    );
  }

  const postPickupAnchorTime = firstPickup?.appointmentEnd ?? null;
  if (postPickupAnchorTime !== null) {
    const postPickupAt = new Date(
      postPickupAnchorTime.getTime() +
        settings.postPickupEscalationMinutes * 60 * 1000,
    );
    const delayMs = postPickupAt.getTime() - now.getTime();
    if (delayMs > POST_PICKUP_CAP_MS) {
      deps.logger.info(
        'Skipping POST_PICKUP — escalation is outside the 48h window',
        { loadId, delayMs },
      );
    } else {
      await scheduleRow(deps, {
        loadId,
        driverId,
        organizationId: load.organizationId,
        anchor: 'POST_PICKUP',
        scheduledAt: postPickupAt,
      });
    }
  } else {
    deps.logger.info(
      'Skipping POST_PICKUP — first pickup has no appointmentEnd',
      { loadId },
    );
  }
};

/**
 * Computes the expected transit duration (ms) for a load. Preference order:
 *   1. (first pickup departureTime) -> (last delivery appointmentStart)
 *   2. (first pickup appointmentStart) -> (last delivery appointmentStart)
 * Returns null if neither pair is available.
 */
const computeTransitMs = (load: LoadForScheduling): number | null => {
  const firstPickup = findFirstPickupStop(load.stops);
  const lastDelivery = findLastDeliveryStop(load.stops);

  if (firstPickup === null || lastDelivery === null) {
    return null;
  }
  if (lastDelivery.appointmentStart === null) {
    return null;
  }

  const etaMs = lastDelivery.appointmentStart.getTime();
  const startMs =
    firstPickup.departureTime?.getTime() ??
    firstPickup.appointmentStart?.getTime() ??
    null;

  if (startMs === null) {
    return null;
  }

  const transitMs = etaMs - startMs;
  return transitMs > 0 ? transitMs : null;
};

const seedTransitPrompts = async (
  loadId: string,
  deps: SmsPromptSchedulerSubscriberDeps,
): Promise<void> => {
  const ctx = await loadSeedContext(loadId, deps);
  if (ctx === null) {
    return;
  }
  const { load, driverId, settings } = ctx;
  const now = new Date();

  const transitMs = computeTransitMs(load);
  const lastDelivery = findLastDeliveryStop(load.stops);
  const eta = lastDelivery?.appointmentStart ?? null;

  if (eta !== null && eta.getTime() <= now.getTime()) {
    deps.logger.info(
      'Skipping transit prompt — ETA is already in the past',
      { loadId, eta: eta.toISOString() },
    );
    return;
  }

  let scheduledAt: Date;

  if (transitMs !== null && transitMs < SHORT_TRANSIT_THRESHOLD_MS) {
    const firstPickup = findFirstPickupStop(load.stops);
    const pickupStartMs =
      firstPickup?.departureTime?.getTime() ??
      firstPickup?.appointmentStart?.getTime() ??
      now.getTime();
    const midpointMs = pickupStartMs + Math.floor(transitMs / 2);
    scheduledAt =
      midpointMs > now.getTime() ? new Date(midpointMs) : new Date(now);
  } else {
    scheduledAt = new Date(
      now.getTime() + settings.transitIntervalMinutes * 60 * 1000,
    );
  }

  await scheduleRow(deps, {
    loadId,
    driverId,
    organizationId: load.organizationId,
    anchor: 'TRANSIT_INTERVAL',
    scheduledAt,
  });
};

const handleLoadStatusChanged = async (
  data: EventMap['load.status.changed'],
  deps: SmsPromptSchedulerSubscriberDeps,
): Promise<void> => {
  try {
    const { toStatus, loadId } = data;

    if (toStatus === 'DISPATCHED') {
      await seedDispatchedPrompts(loadId, deps);
      return;
    }

    if (toStatus === 'IN_TRANSIT') {
      await seedTransitPrompts(loadId, deps);
      return;
    }

    if (toStatus === 'AT_PICKUP') {
      await cancelPendingByAnchor(
        {
          loadId,
          anchor: 'POST_PICKUP',
          reason: 'load_arrived_at_pickup',
        },
        deps,
      );
      return;
    }

    if (toStatus === 'AT_DELIVERY') {
      await cancelPendingByAnchor(
        {
          loadId,
          anchor: 'TRANSIT_INTERVAL',
          reason: 'load_arrived_at_delivery',
        },
        deps,
      );
      return;
    }

    if (TERMINAL_STATUSES.has(toStatus)) {
      await cancelAllPending(loadId, `load_${toStatus.toLowerCase()}`, deps);
    }
  } catch (error: unknown) {
    deps.logger.error('Failed to process load.status.changed for SMS prompts', {
      error: error instanceof Error ? error.message : String(error),
      loadId: data.loadId,
      toStatus: data.toStatus,
    });
  }
};

const handleCheckCallLogged = async (
  data: EventMap['load.checkcall.logged'],
  deps: SmsPromptSchedulerSubscriberDeps,
): Promise<void> => {
  try {
    const pending = await deps.scheduleRepo.findPending(
      data.loadId,
      'TRANSIT_INTERVAL',
    );
    if (pending.length === 0) {
      return;
    }
    // findPending is ordered by scheduledAt asc — take the earliest.
    const [next] = pending;
    if (next === undefined) {
      return;
    }
    await deps.scheduleRepo.cancel([next.id], 'check_call_superseded');
    await deps.eventBus
      .publish('sms.prompt.canceled', {
        smsPromptScheduleId: next.id,
        loadId: data.loadId,
        reason: 'check_call_superseded',
      })
      .catch((error: unknown) => {
        deps.logger.error(
          'Failed to publish sms.prompt.canceled after check call',
          {
            error: error instanceof Error ? error.message : String(error),
            smsPromptScheduleId: next.id,
          },
        );
      });
  } catch (error: unknown) {
    deps.logger.error(
      'Failed to process load.checkcall.logged for SMS prompts',
      {
        error: error instanceof Error ? error.message : String(error),
        loadId: data.loadId,
      },
    );
  }
};

export const initializeSmsPromptSchedulerSubscriber = async (
  deps: SmsPromptSchedulerSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe(
    'load.status.changed',
    QUEUE_GROUP,
    async (data) => {
      await handleLoadStatusChanged(data, deps);
    },
  );

  await deps.eventBus.subscribe(
    'load.checkcall.logged',
    QUEUE_GROUP,
    async (data) => {
      await handleCheckCallLogged(data, deps);
    },
  );

  deps.logger.info('SMS prompt scheduler subscriber initialized');
};
