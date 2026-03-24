import type { WeeklyGrossItem } from '../../types/weeklyGrossTypes';

interface WeeklyGrossItemResponse {
  vehicleId: string;
  unitNumber: string;
  carrierName: string;
  driverName: string | null;
  loadCount: number;
  revenue: number;
  target: number;
  percent: number;
}

export const toWeeklyGrossResponse = (
  items: WeeklyGrossItem[],
): WeeklyGrossItemResponse[] =>
  items.map((item) => ({
    vehicleId: item.vehicleId,
    unitNumber: item.unitNumber,
    carrierName: item.carrierName,
    driverName: item.driverName,
    loadCount: item.loadCount,
    revenue: Number(item.revenue.toFixed(2)),
    target: Number(item.target.toFixed(2)),
    percent: item.percent,
  }));
