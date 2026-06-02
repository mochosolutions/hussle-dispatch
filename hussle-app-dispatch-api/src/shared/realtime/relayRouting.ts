import type { EventMap } from '@/shared/messaging/eventMap';

/**
 * Load event names the ws-gateway relays. These are the only events that may
 * reach a client socket; internal/billing events are never relayed.
 */
export type RelayEventName = 'load.status.changed' | 'document.confirmed' | 'load.checkcall.logged';

export const RELAY_EVENTS: readonly RelayEventName[] = [
  'load.status.changed',
  'document.confirmed',
  'load.checkcall.logged',
] as const;

/**
 * Subset of relayed events a DRIVER socket is allowed to receive. Drivers only
 * see load-progress facts (status, doc-confirm, check-call) for their OWN load
 * — never org-wide, internal, or billing events.
 */
export const DRIVER_VISIBLE_EVENTS: readonly RelayEventName[] = [
  'load.status.changed',
  'document.confirmed',
  'load.checkcall.logged',
] as const;

export interface RelayTarget {
  room: string;
  eventName: RelayEventName;
}

interface RelayablePayload {
  organizationId: string;
  driverId?: string | null;
}

/**
 * Pure routing decision: given a relay event and its payload, return the rooms
 * the event should be emitted to. Always targets the org room. Additionally
 * targets the driver room ONLY when the event is driver-visible AND carries a
 * concrete `driverId`. This is the single source of truth for fan-out targeting
 * and is unit-tested directly to prove cross-driver and cross-org isolation.
 */
export const computeRelayTargets = <K extends RelayEventName>(
  eventName: K,
  payload: EventMap[K] & RelayablePayload,
): RelayTarget[] => {
  const targets: RelayTarget[] = [{ room: `org:${payload.organizationId}`, eventName }];

  const driverId = payload.driverId;
  if (
    DRIVER_VISIBLE_EVENTS.includes(eventName) &&
    driverId !== undefined &&
    driverId !== null &&
    driverId !== ''
  ) {
    targets.push({ room: `driver:${driverId}`, eventName });
  }

  return targets;
};
