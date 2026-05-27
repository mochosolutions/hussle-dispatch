import type { LoadWithRelations } from '../types/loadTypes';

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Derives PER_HOUR estimated hours from a load's pickup/delivery stop
 * appointment times. Returns undefined when the appointments are missing or
 * invalid (non-positive span).
 *
 * Retained after US-13 removed `calculateAndPersistFinancials` so future
 * compute-on-read paths can resolve PER_HOUR driver pay from stop times when
 * the explicit `load.estimatedHours` snapshot is absent.
 */
export const deriveEstimatedHours = (
  stops: LoadWithRelations['stops'],
): number | undefined => {
  const pickups = stops.filter((s) => s.type === 'PICKUP');
  const deliveries = stops.filter((s) => s.type === 'DELIVERY');

  const firstPickup = pickups.length > 0 ? pickups[0] : undefined;
  const lastDelivery = deliveries.length > 0 ? deliveries[deliveries.length - 1] : undefined;

  if (
    firstPickup?.appointmentStart === undefined ||
    firstPickup.appointmentStart === null ||
    lastDelivery?.appointmentStart === undefined ||
    lastDelivery.appointmentStart === null
  ) {
    return undefined;
  }

  const diffMs =
    lastDelivery.appointmentStart.getTime() - firstPickup.appointmentStart.getTime();
  if (diffMs <= 0) return undefined;

  return diffMs / (1000 * 60 * 60);
};
