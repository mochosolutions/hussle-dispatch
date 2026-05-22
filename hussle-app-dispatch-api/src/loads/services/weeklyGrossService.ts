import { NotFoundError } from '@/shared/errors';
import type {
  GetVehicleWeeklyRevenueInput,
  GetWeeklyGrossInput,
  VehicleWeeklyRevenuePoint,
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

const DEFAULT_SERIES_WEEKS = 8;
const MAX_SERIES_WEEKS = 26;

/**
 * Builds a list of [weekStart, weekEnd] tuples for the previous `count`
 * ISO weeks ending with the current week. Returned oldest-first so charts
 * render left-to-right.
 */
const buildWeekRanges = (count: number): { weekStart: Date; weekEnd: Date }[] => {
  const ranges: { weekStart: Date; weekEnd: Date }[] = [];
  const currentMonday = getWeekStart();

  for (let i = count - 1; i >= 0; i -= 1) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    ranges.push({ weekStart, weekEnd });
  }

  return ranges;
};

export interface WeeklyGrossService {
  getWeeklyGross(input: GetWeeklyGrossInput): Promise<WeeklyGrossItem[]>;
  getVehicleWeeklyRevenue(
    input: GetVehicleWeeklyRevenueInput,
  ): Promise<VehicleWeeklyRevenuePoint[]>;
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
      const { revenue, loadCount } = await deps.weeklyGrossQuery.getWeeklyRevenue(
        vehicle.id,
        weekStart,
        weekEnd,
      );

      const percent = target.isZero()
        ? 0
        : revenue.div(target).mul(100).toDecimalPlaces(1).toNumber();

      const driverName = vehicle.driver
        ? `${vehicle.driver.firstName} ${vehicle.driver.lastName}`.trim()
        : null;

      items.push({
        vehicleId: vehicle.id,
        unitNumber: vehicle.unitNumber,
        carrierName: vehicle.carrier.name,
        driverName,
        loadCount,
        revenue,
        target,
        percent,
      });
    }

    return items;
  },

  getVehicleWeeklyRevenue: async ({ organizationId, vehicleId, weeks }) => {
    const requested = Number.isFinite(weeks) && weeks > 0 ? Math.floor(weeks) : DEFAULT_SERIES_WEEKS;
    const safeWeeks = Math.min(requested, MAX_SERIES_WEEKS);

    const ownership = await deps.weeklyGrossQuery.findVehicleCarrierType(
      vehicleId,
      organizationId,
    );

    if (ownership === null) {
      throw new NotFoundError('Vehicle not found.');
    }

    const target = await deps.weeklyGrossQuery.getWeeklyGrossTarget(organizationId);
    const ranges = buildWeekRanges(safeWeeks);

    const points: VehicleWeeklyRevenuePoint[] = await Promise.all(
      ranges.map(async ({ weekStart, weekEnd }) => {
        const { revenue, loadCount } = await deps.weeklyGrossQuery.getWeeklyRevenue(
          vehicleId,
          weekStart,
          weekEnd,
        );
        return { weekStart, weekEnd, revenue, loadCount, target };
      }),
    );

    return points;
  },
});
