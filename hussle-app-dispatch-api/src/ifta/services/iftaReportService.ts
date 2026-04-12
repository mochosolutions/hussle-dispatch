import type { Logger } from '@/shared/utils/logger';
import type {
  IftaReportQueryPort,
  IftaReportInput,
  IftaReportResult,
  IftaVehicleEntry,
  IftaStateEntry,
  IftaVehicleTotals,
  MilesByStateRow,
  FuelByStateRow,
} from '../types/iftaTypes';

export interface IftaReportServiceDeps {
  iftaReportQuery: IftaReportQueryPort;
  logger: Logger;
}

export interface IftaReportService {
  generateReport(input: IftaReportInput): Promise<IftaReportResult>;
}

interface VehicleAccumulator {
  unitNumber: string;
  states: Map<string, { miles: number; gallons: number; cost: number }>;
}

const deriveQuarterDates = (
  year: number,
  quarter: number,
): { startDate: Date; endDate: Date; periodStart: string; periodEnd: string } => {
  const startDate = new Date(year, (quarter - 1) * 3, 1);
  const endDate = new Date(year, quarter * 3, 0, 23, 59, 59, 999);

  const pad = (n: number): string => String(n).padStart(2, '0');
  const periodStart = `${year}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
  const periodEnd = `${year}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;

  return { startDate, endDate, periodStart, periodEnd };
};

const roundTwo = (value: number): number => Math.round(value * 100) / 100;

const buildVehicleMap = (
  milesRows: MilesByStateRow[],
  fuelRows: FuelByStateRow[],
): Map<string, VehicleAccumulator> => {
  const vehicleMap = new Map<string, VehicleAccumulator>();

  milesRows.forEach((row) => {
    let vehicle = vehicleMap.get(row.vehicleId);
    if (!vehicle) {
      vehicle = { unitNumber: row.unitNumber, states: new Map() };
      vehicleMap.set(row.vehicleId, vehicle);
    }

    const existing = vehicle.states.get(row.state);
    if (existing) {
      existing.miles += row.miles;
    } else {
      vehicle.states.set(row.state, { miles: row.miles, gallons: 0, cost: 0 });
    }
  });

  fuelRows.forEach((row) => {
    let vehicle = vehicleMap.get(row.vehicleId);
    if (!vehicle) {
      vehicle = { unitNumber: '', states: new Map() };
      vehicleMap.set(row.vehicleId, vehicle);
    }

    const existing = vehicle.states.get(row.state);
    if (existing) {
      existing.gallons += row.gallons;
      existing.cost += row.cost;
    } else {
      vehicle.states.set(row.state, { miles: 0, gallons: row.gallons, cost: row.cost });
    }
  });

  return vehicleMap;
};

const buildVehicleTotals = (states: IftaStateEntry[]): IftaVehicleTotals => {
  let totalMiles = 0;
  let totalGallons = 0;
  let totalFuelCost = 0;

  states.forEach((s) => {
    totalMiles += s.milesDriven;
    totalGallons += s.fuelGallons;
    totalFuelCost += s.fuelCost;
  });

  const averageMpg = totalGallons > 0 ? roundTwo(totalMiles / totalGallons) : 0;

  return {
    totalMiles: roundTwo(totalMiles),
    totalGallons: roundTwo(totalGallons),
    totalFuelCost: roundTwo(totalFuelCost),
    averageMpg,
  };
};

export const createIftaReportService = (deps: IftaReportServiceDeps): IftaReportService => ({
  generateReport: async (input) => {
    const { startDate, endDate, periodStart, periodEnd } = deriveQuarterDates(
      input.year,
      input.quarter,
    );

    const queryParams = {
      organizationId: input.organizationId,
      vehicleId: input.vehicleId,
      startDate,
      endDate,
    };

    const [milesRows, fuelRows] = await Promise.all([
      deps.iftaReportQuery.getMilesByState(queryParams),
      deps.iftaReportQuery.getFuelByState(queryParams),
    ]);

    const vehicleMap = buildVehicleMap(milesRows, fuelRows);

    const vehicles: IftaVehicleEntry[] = [];

    vehicleMap.forEach((accumulator, vehicleId) => {
      const states: IftaStateEntry[] = [];

      accumulator.states.forEach((data, state) => {
        states.push({
          state,
          milesDriven: roundTwo(data.miles),
          fuelGallons: roundTwo(data.gallons),
          fuelCost: roundTwo(data.cost),
        });
      });

      states.sort((a, b) => a.state.localeCompare(b.state));

      const totals = buildVehicleTotals(states);

      vehicles.push({
        vehicleId,
        unitNumber: accumulator.unitNumber,
        states,
        totals,
      });
    });

    const fleetTotals = buildVehicleTotals(
      vehicles.flatMap((v) => v.states),
    );

    deps.logger.info('IFTA report generated', {
      organizationId: input.organizationId,
      year: input.year,
      quarter: input.quarter,
      vehicleCount: vehicles.length,
    });

    return {
      year: input.year,
      quarter: input.quarter,
      periodStart,
      periodEnd,
      vehicles,
      fleetTotals,
    };
  },
});
