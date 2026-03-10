import type { PrismaClient } from '@prisma/client';
import type { FleetQueryPort } from '../types/loadIntelPorts';
import type { FleetUnit } from '../types/loadIntelTypes';
import type { EquipmentType } from '../../shared/constants/equipmentTypes';

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
          status: 'active',
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

        // Calculate vehicle CPM from expenses
        const totalMonthlyCost = v.expenses.reduce(
          (sum, e) => sum + Number(e.monthlyAmount),
          0,
        );
        const monthlyMiles = v.monthlyMilesTarget ?? 10000;
        const vehicleCpm = monthlyMiles > 0 ? totalMonthlyCost / monthlyMiles : 0;

        const preferredLanes = Array.isArray(driver?.preferredLanes)
          ? (driver.preferredLanes as string[])
          : [];
        const noGoZones = Array.isArray(driver?.noGoZones)
          ? (driver.noGoZones as string[])
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
          profitMargin: 0.15, // TODO: Pull from OrgSettings.minBookRateProfitMargin
        };
      });
  },
});
