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
 * One weekly bucket of revenue for a single vehicle.
 */
export interface VehicleWeeklyRevenuePoint {
  weekStart: Date;
  weekEnd: Date;
  revenue: Decimal;
  loadCount: number;
  target: Decimal;
}

export interface GetVehicleWeeklyRevenueInput {
  organizationId: string;
  role: string;
  vehicleId: string;
  weeks: number;
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
  /**
   * Confirms the vehicle exists and belongs to the org. Returns the vehicle's
   * carrier type (used to choose between customerRate and dispatchFee for
   * revenue aggregation) or `null` when not found.
   */
  findVehicleCarrierType(
    vehicleId: string,
    organizationId: string,
  ): Promise<{ carrierType: string } | null>;
}
