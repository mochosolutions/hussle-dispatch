import Decimal from 'decimal.js';
import type {
  GetWeeklyGrossInput,
  WeeklyGrossItem,
  WeeklyGrossQueryPort,
} from '../types/weeklyGrossTypes';

/**
 * Returns the Monday (00:00:00) of the current ISO week.
 */
const getWeekStart = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // getDay(): 0 = Sunday, 1 = Monday, ...
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Returns the Sunday (23:59:59.999) of the current ISO week.
 */
const getWeekEnd = (): Date => {
  const monday = getWeekStart();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

export interface WeeklyGrossService {
  getWeeklyGross(input: GetWeeklyGrossInput): Promise<WeeklyGrossItem[]>;
}

interface WeeklyGrossServiceDeps {
  weeklyGrossQuery: WeeklyGrossQueryPort;
}

export const createWeeklyGrossService = (
  deps: WeeklyGrossServiceDeps,
): WeeklyGrossService => ({
  getWeeklyGross: async ({ organizationId }) => {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();

    const [vehicles, target] = await Promise.all([
      deps.weeklyGrossQuery.getActiveVehiclesWithCarrier(organizationId),
      deps.weeklyGrossQuery.getWeeklyGrossTarget(organizationId),
    ]);

    const items: WeeklyGrossItem[] = [];

    for (const vehicle of vehicles) {
      const revenue = await deps.weeklyGrossQuery.getWeeklyRevenue(
        vehicle.id,
        weekStart,
        weekEnd,
      );

      const percent = target.isZero()
        ? 0
        : revenue.div(target).mul(100).toDecimalPlaces(1).toNumber();

      items.push({
        vehicleId: vehicle.id,
        unitNumber: vehicle.unitNumber,
        carrierName: vehicle.carrier.name,
        revenue,
        target,
        percent,
      });
    }

    return items;
  },
});
