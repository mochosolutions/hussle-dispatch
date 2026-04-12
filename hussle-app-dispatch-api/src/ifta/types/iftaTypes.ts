import type { LoadStateMiles, MileageSource } from '@prisma/client';

// ---------------------------------------------------------------------------
// State miles repo port
// ---------------------------------------------------------------------------

export interface StateMilesRepoPort {
  upsertMany(
    loadId: string,
    entries: { state: string; miles: number; source: MileageSource }[],
  ): Promise<void>;
  deleteByLoadIdAndSource(loadId: string, source: MileageSource): Promise<void>;
  findByLoadId(loadId: string): Promise<LoadStateMiles[]>;
}

// ---------------------------------------------------------------------------
// Load mileage update port
// ---------------------------------------------------------------------------

export interface LoadMileageUpdatePort {
  updateTotalMiles(loadId: string, miles: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// Stop coordinate query port
// ---------------------------------------------------------------------------

export interface StopWithCoords {
  id: string;
  sequence: number;
  latitude: number | null;
  longitude: number | null;
}

export interface StopCoordinateQueryPort {
  findStopsWithCoordinates(
    loadId: string,
    organizationId: string,
  ): Promise<StopWithCoords[]>;
}

// ---------------------------------------------------------------------------
// IFTA Report types
// ---------------------------------------------------------------------------

export interface IftaReportInput {
  organizationId: string;
  year: number;
  quarter: number;
  vehicleId?: string;
}

export interface IftaStateEntry {
  state: string;
  milesDriven: number;
  fuelGallons: number;
  fuelCost: number;
}

export interface IftaVehicleTotals {
  totalMiles: number;
  totalGallons: number;
  totalFuelCost: number;
  averageMpg: number;
}

export interface IftaVehicleEntry {
  vehicleId: string;
  unitNumber: string;
  states: IftaStateEntry[];
  totals: IftaVehicleTotals;
}

export interface IftaReportResult {
  year: number;
  quarter: number;
  periodStart: string;
  periodEnd: string;
  vehicles: IftaVehicleEntry[];
  fleetTotals: IftaVehicleTotals;
}

// ---------------------------------------------------------------------------
// IFTA report query port
// ---------------------------------------------------------------------------

export interface MilesByStateRow {
  vehicleId: string;
  unitNumber: string;
  state: string;
  miles: number;
}

export interface FuelByStateRow {
  vehicleId: string;
  state: string;
  gallons: number;
  cost: number;
}

export interface IftaReportQueryPort {
  getMilesByState(params: {
    organizationId: string;
    vehicleId?: string;
    startDate: Date;
    endDate: Date;
  }): Promise<MilesByStateRow[]>;
  getFuelByState(params: {
    organizationId: string;
    vehicleId?: string;
    startDate: Date;
    endDate: Date;
  }): Promise<FuelByStateRow[]>;
}
