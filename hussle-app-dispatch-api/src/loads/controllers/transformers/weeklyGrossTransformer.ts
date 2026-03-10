import type { WeeklyGrossItem } from '../../types/weeklyGrossTypes';

interface WeeklyGrossItemResponse {
  vehicleId: string;
  unitNumber: string;
  carrierName: string;
  revenue: string;
  target: string;
  percent: number;
}

export const toWeeklyGrossResponse = (
  items: WeeklyGrossItem[],
): WeeklyGrossItemResponse[] =>
  items.map((item) => ({
    vehicleId: item.vehicleId,
    unitNumber: item.unitNumber,
    carrierName: item.carrierName,
    revenue: item.revenue.toFixed(2),
    target: item.target.toFixed(2),
    percent: item.percent,
  }));
