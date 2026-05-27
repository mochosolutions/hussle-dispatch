import type { EquipmentType } from '@prisma/client';
import type {
  LoadForScheduling,
  LoadSchedulerStop,
} from '../types/loadSchedulerQueryPort';
import type { SmsPromptAnchorValue } from '../types/smsPromptScheduleRepoPort';
import { resolveStopTimezone } from './resolveStopTimezone';

const EQUIPMENT_LABELS: Partial<Record<EquipmentType, string>> = {
  REEFER: '❄️ Reefer',
  DRY_VAN: '🚛 Dry Van',
  FLATBED: '🛻 Flatbed',
};

const formatTime = (
  date: Date | null,
  city: string | null,
  state: string | null,
): string => {
  if (date === null) {
    return 'TBD';
  }
  const tz = resolveStopTimezone(city, state);
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz ?? 'UTC',
  });
  const formatted = formatter.format(date);
  return tz === null ? `${formatted} UTC` : formatted;
};

const findFirstPickup = (
  stops: LoadSchedulerStop[],
): LoadSchedulerStop | null =>
  stops.find((stop) => stop.type === 'PICKUP') ?? null;

const findLastDelivery = (
  stops: LoadSchedulerStop[],
): LoadSchedulerStop | null => {
  const deliveries = stops.filter((stop) => stop.type === 'DELIVERY');
  return deliveries.length === 0 ? null : (deliveries[deliveries.length - 1] ?? null);
};

interface LocatedStop {
  appointmentStart: Date | null;
  city: string;
  state: string;
}

const toLocatedStop = (
  stop: LoadSchedulerStop | null,
): LocatedStop | null => {
  if (stop === null) {
    return null;
  }
  const city = stop.city?.trim() ?? '';
  const state = stop.state?.trim() ?? '';
  if (city === '' || state === '') {
    return null;
  }
  return { appointmentStart: stop.appointmentStart, city, state };
};

const composeDispatched = (
  load: LoadForScheduling,
  shortUrl: string,
): string => {
  const originStop = toLocatedStop(findFirstPickup(load.stops));
  const destStop = toLocatedStop(findLastDelivery(load.stops));

  if (originStop === null || destStop === null) {
    return `Hussle: Load #${load.loadNumber} dispatched\n${shortUrl}`;
  }

  const lines: string[] = [];
  lines.push(`Hussle: Load #${load.loadNumber} dispatched`);
  lines.push(
    `${originStop.city}, ${originStop.state} → ${destStop.city}, ${destStop.state}`,
  );
  const pickupTime = formatTime(
    originStop.appointmentStart,
    originStop.city,
    originStop.state,
  );
  const deliveryTime = formatTime(
    destStop.appointmentStart,
    destStop.city,
    destStop.state,
  );
  lines.push(
    `🕖 PU: ${pickupTime} | 🕛 DEL: ${deliveryTime}`,
  );

  if (load.equipmentType !== null) {
    const label = EQUIPMENT_LABELS[load.equipmentType];
    if (label !== undefined) {
      lines.push(label);
    }
  }

  lines.push(shortUrl);
  return lines.join('\n');
};

export interface ComposeSmsBodyInput {
  anchor: SmsPromptAnchorValue;
  load: LoadForScheduling;
  shortUrl: string;
}

export const composeSmsBody = (input: ComposeSmsBodyInput): string => {
  const { anchor, load, shortUrl } = input;

  switch (anchor) {
    case 'DISPATCHED':
      return composeDispatched(load, shortUrl);
    case 'PRE_PICKUP':
      return `Hussle: Load #${load.loadNumber} pickup is coming up. Confirm you're en route.\n${shortUrl}`;
    case 'POST_PICKUP':
      return `Hussle: Load #${load.loadNumber} — pickup window passed. Update status now.\n${shortUrl}`;
    case 'TRANSIT_INTERVAL':
      return `Hussle: Load #${load.loadNumber} status check. Tap to share current location.\n${shortUrl}`;
    case 'MANUAL':
      return `Hussle: Load #${load.loadNumber} needs a check-in.\n${shortUrl}`;
    default: {
      const exhaustive: never = anchor;
      return exhaustive;
    }
  }
};
