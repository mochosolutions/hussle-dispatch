import type { VehicleWeeklyRevenuePoint } from '../../types/weeklyGrossTypes';

interface VehicleWeeklyRevenuePointResponse {
  weekStart: string;
  weekEnd: string;
  revenue: number;
  loadCount: number;
  target: number;
}

export const toVehicleWeeklyRevenueResponse = (
  points: VehicleWeeklyRevenuePoint[],
): VehicleWeeklyRevenuePointResponse[] =>
  points.map((point) => ({
    weekStart: point.weekStart.toISOString(),
    weekEnd: point.weekEnd.toISOString(),
    revenue: Number(point.revenue.toFixed(2)),
    loadCount: point.loadCount,
    target: Number(point.target.toFixed(2)),
  }));
