import type { StopType } from '@prisma/client';
import { ValidationError } from '@/shared/errors';

export interface StopWithDateLike {
  type?: StopType;
  appointmentStart?: Date | string | null;
}

export const DELIVERY_BEFORE_PICKUP_MESSAGE =
  'Delivery date cannot be earlier than pickup date';

const toMs = (s: StopWithDateLike): number | null => {
  if (!s.appointmentStart) return null;
  const t = new Date(s.appointmentStart).getTime();
  return Number.isFinite(t) ? t : null;
};

export const isDeliveryAfterPickup = (
  stops: readonly StopWithDateLike[] | null | undefined,
): boolean => {
  if (!stops || stops.length === 0) {
    return true;
  }
  const pickupTimes = stops
    .filter((s) => s.type === 'PICKUP')
    .map(toMs)
    .filter((t): t is number => t !== null);
  const deliveryTimes = stops
    .filter((s) => s.type === 'DELIVERY')
    .map(toMs)
    .filter((t): t is number => t !== null);
  if (pickupTimes.length === 0 || deliveryTimes.length === 0) {
    return true;
  }
  const latestPickup = Math.max(...pickupTimes);
  const earliestDelivery = Math.min(...deliveryTimes);
  return earliestDelivery >= latestPickup;
};

export const assertDeliveryAfterPickup = (
  stops: readonly StopWithDateLike[] | null | undefined,
): void => {
  if (!isDeliveryAfterPickup(stops)) {
    throw new ValidationError(DELIVERY_BEFORE_PICKUP_MESSAGE);
  }
};
