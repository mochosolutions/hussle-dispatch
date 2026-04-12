import { createIftaReportService } from '../iftaReportService';
import type { IftaReportQueryPort } from '../../types/iftaTypes';
import type { Logger } from '@/shared/utils/logger';

describe('iftaReportService', () => {
  const mockDeps = {
    iftaReportQuery: {
      getMilesByState: jest.fn(),
      getFuelByState: jest.fn(),
    } as jest.Mocked<IftaReportQueryPort>,
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as jest.Mocked<Logger>,
  };

  const service = createIftaReportService(mockDeps);

  beforeEach(() => jest.clearAllMocks());

  it('derives Q1 date range as Jan 1 to Mar 31', async () => {
    mockDeps.iftaReportQuery.getMilesByState.mockResolvedValue([]);
    mockDeps.iftaReportQuery.getFuelByState.mockResolvedValue([]);

    const result = await service.generateReport({
      organizationId: 'org-1',
      year: 2026,
      quarter: 1,
    });

    expect(result.periodStart).toBe('2026-01-01');
    expect(result.periodEnd).toBe('2026-03-31');

    const milesCall = mockDeps.iftaReportQuery.getMilesByState.mock.calls[0]?.[0];
    expect(milesCall?.startDate).toEqual(new Date(2026, 0, 1));
    expect(milesCall?.endDate).toEqual(new Date(2026, 2, 31, 23, 59, 59, 999));
  });

  it('derives Q4 date range as Oct 1 to Dec 31', async () => {
    mockDeps.iftaReportQuery.getMilesByState.mockResolvedValue([]);
    mockDeps.iftaReportQuery.getFuelByState.mockResolvedValue([]);

    const result = await service.generateReport({
      organizationId: 'org-1',
      year: 2026,
      quarter: 4,
    });

    expect(result.periodStart).toBe('2026-10-01');
    expect(result.periodEnd).toBe('2026-12-31');

    const milesCall = mockDeps.iftaReportQuery.getMilesByState.mock.calls[0]?.[0];
    expect(milesCall?.startDate).toEqual(new Date(2026, 9, 1));
    expect(milesCall?.endDate).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
  });

  it('merges miles and fuel data per vehicle per state', async () => {
    mockDeps.iftaReportQuery.getMilesByState.mockResolvedValue([
      { vehicleId: 'v1', unitNumber: 'T-101', state: 'TX', miles: 500 },
    ]);
    mockDeps.iftaReportQuery.getFuelByState.mockResolvedValue([
      { vehicleId: 'v1', state: 'TX', gallons: 50, cost: 200 },
    ]);

    const result = await service.generateReport({
      organizationId: 'org-1',
      year: 2026,
      quarter: 1,
    });

    expect(result.vehicles).toHaveLength(1);
    const vehicle = result.vehicles[0];
    expect(vehicle?.vehicleId).toBe('v1');
    expect(vehicle?.unitNumber).toBe('T-101');
    expect(vehicle?.states).toHaveLength(1);

    const txState = vehicle?.states[0];
    expect(txState?.state).toBe('TX');
    expect(txState?.milesDriven).toBe(500);
    expect(txState?.fuelGallons).toBe(50);
    expect(txState?.fuelCost).toBe(200);
  });

  it('calculates correct averageMpg', async () => {
    mockDeps.iftaReportQuery.getMilesByState.mockResolvedValue([
      { vehicleId: 'v1', unitNumber: 'T-101', state: 'TX', miles: 600 },
      { vehicleId: 'v1', unitNumber: 'T-101', state: 'OK', miles: 400 },
    ]);
    mockDeps.iftaReportQuery.getFuelByState.mockResolvedValue([
      { vehicleId: 'v1', state: 'TX', gallons: 30, cost: 120 },
      { vehicleId: 'v1', state: 'OK', gallons: 20, cost: 80 },
    ]);

    const result = await service.generateReport({
      organizationId: 'org-1',
      year: 2026,
      quarter: 1,
    });

    const vehicle = result.vehicles[0];
    expect(vehicle?.totals.totalMiles).toBe(1000);
    expect(vehicle?.totals.totalGallons).toBe(50);
    expect(vehicle?.totals.averageMpg).toBe(20);
  });

  it('returns 0 averageMpg when totalGallons is 0', async () => {
    mockDeps.iftaReportQuery.getMilesByState.mockResolvedValue([
      { vehicleId: 'v1', unitNumber: 'T-101', state: 'TX', miles: 500 },
    ]);
    mockDeps.iftaReportQuery.getFuelByState.mockResolvedValue([]);

    const result = await service.generateReport({
      organizationId: 'org-1',
      year: 2026,
      quarter: 1,
    });

    const vehicle = result.vehicles[0];
    expect(vehicle?.totals.totalMiles).toBe(500);
    expect(vehicle?.totals.totalGallons).toBe(0);
    expect(vehicle?.totals.averageMpg).toBe(0);
  });

  it('calculates fleet-wide totals across multiple vehicles', async () => {
    mockDeps.iftaReportQuery.getMilesByState.mockResolvedValue([
      { vehicleId: 'v1', unitNumber: 'T-101', state: 'TX', miles: 500 },
      { vehicleId: 'v2', unitNumber: 'T-102', state: 'OK', miles: 300 },
    ]);
    mockDeps.iftaReportQuery.getFuelByState.mockResolvedValue([
      { vehicleId: 'v1', state: 'TX', gallons: 50, cost: 200 },
      { vehicleId: 'v2', state: 'OK', gallons: 30, cost: 120 },
    ]);

    const result = await service.generateReport({
      organizationId: 'org-1',
      year: 2026,
      quarter: 2,
    });

    expect(result.vehicles).toHaveLength(2);
    expect(result.fleetTotals.totalMiles).toBe(800);
    expect(result.fleetTotals.totalGallons).toBe(80);
    expect(result.fleetTotals.totalFuelCost).toBe(320);
    expect(result.fleetTotals.averageMpg).toBe(10);
  });

  it('passes vehicleId filter to queries when provided', async () => {
    mockDeps.iftaReportQuery.getMilesByState.mockResolvedValue([]);
    mockDeps.iftaReportQuery.getFuelByState.mockResolvedValue([]);

    await service.generateReport({
      organizationId: 'org-1',
      year: 2026,
      quarter: 1,
      vehicleId: 'v1',
    });

    const milesCall = mockDeps.iftaReportQuery.getMilesByState.mock.calls[0]?.[0];
    expect(milesCall?.vehicleId).toBe('v1');

    const fuelCall = mockDeps.iftaReportQuery.getFuelByState.mock.calls[0]?.[0];
    expect(fuelCall?.vehicleId).toBe('v1');
  });
});
