import type Decimal from 'decimal.js';

/**
 * A single vehicle's weekly gross revenue summary.
 */
export interface WeeklyGrossItem {
  vehicleId: string;
  unitNumber: string;
  carrierName: string;
  driverName: string | null;
  loadCount: number;
  revenue: Decimal;
  target: Decimal;
  percent: number;
}

/**
 * Service input for the weekly gross query.
 */
export interface GetWeeklyGrossInput {
  organizationId: string;
  role: string;
}

/**
 * Port for fetching weekly gross data.
 */
export interface WeeklyGrossQueryPort {
  getActiveVehiclesWithCarrier(organizationId: string): Promise<
    {
      id: string;
      unitNumber: string;
      carrier: { name: string };
      driver: { firstName: string; lastName: string } | null;
    }[]
  >;
  getWeeklyRevenue(
    vehicleId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<{ revenue: Decimal; loadCount: number }>;
  getWeeklyGrossTarget(organizationId: string): Promise<Decimal>;
}
