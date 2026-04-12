import type { PrismaClient } from '@prisma/client';
import type { FleetQueryPort } from '../types/loadIntelPorts';
import type { FleetUnit } from '../types/loadIntelTypes';
import type { EquipmentType } from '../../shared/constants/equipmentTypes';
import { normalizeLanes, normalizeZones } from '../../shared/scoring/normalizeDriverPreferences';
import { calculateCpm } from '../../shared/scoring/calculateCpm';
import type { ExpenseItem } from '../../shared/scoring/calculateCpm';

/**
 * Prisma-backed adapter for querying active fleet units.
 * Joins Vehicle -> Driver -> Carrier -> TruckExpense to build FleetUnit records.
 */
export const createFleetQueryAdapter = (prisma: PrismaClient): FleetQueryPort => ({
  getActiveFleetUnits: async (orgId: string): Promise<FleetUnit[]> => {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        carrier: {
          managedByOrgId: orgId,
          status: 'ACTIVE',
        },
        driver: {
          isNot: null,
        },
      },
      include: {
        driver: true,
        carrier: true,
        expenses: true,
      },
    });

    return vehicles
      .filter((v) => v.driver !== null)
      .map((v) => {
        const driver = v.driver;

        const monthlyMiles = v.monthlyMilesTarget ?? 10000;
        const expenseItems: ExpenseItem[] = v.expenses.map((e) => ({
          monthlyCost: Number(e.monthlyAmount),
          milesPerMonth: monthlyMiles,
        }));
        const vehicleCpm = calculateCpm(expenseItems);

        const preferredLanes = Array.isArray(driver?.preferredLanes)
          ? normalizeLanes(driver.preferredLanes)
          : [];
        const noGoZones = Array.isArray(driver?.noGoZones)
          ? normalizeZones(driver.noGoZones)
          : [];

        return {
          vehicleId: v.id,
          unitNumber: v.unitNumber,
          driverName: `${driver?.firstName ?? ''} ${driver?.lastName ?? ''}`.trim(),
          driverId: driver?.id ?? '',
          vehicleCpm,
          monthlyMilesTarget: monthlyMiles,
          homeBaseCity: driver?.homeBaseCity ?? '',
          homeBaseState: driver?.homeBaseState ?? '',
          currentCity: driver?.currentCity ?? '',
          currentState: driver?.currentState ?? '',
          preferredLanes,
          noGoZones,
          maxDaysOut: driver?.maxDaysOut ?? 5,
          currentDaysOut: 0, // TODO: Calculate from current load assignment
          equipmentType: v.type as EquipmentType,
          dispatchFeePercent: Number(v.carrier.dispatchFeePercent) / 100,
          profitMargin: 15 / 100, // TODO: Pull from OrgSettings.minBookRateProfitMargin
        };
      });
  },
});
