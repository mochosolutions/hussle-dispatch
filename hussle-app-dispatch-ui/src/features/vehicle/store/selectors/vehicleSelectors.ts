import { createSelector } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { vehicleSelectors } from '../reducers/vehicleEntitySlice';
import { carrierSelectors } from 'features/carrier/store/reducers/carrierEntitySlice';
import { driverSelectors } from 'features/driver/store/reducers/driverEntitySlice';

const DATE_FORMAT = 'MM/dd/yyyy';

const formatDate = (value: string | null) => (value ? format(new Date(value), DATE_FORMAT) : '');

export const selectAllVehicles = (state: RootState) => vehicleSelectors.selectAll(state);

export const selectVehicleById = (id: string) => (state: RootState) =>
  vehicleSelectors.selectById(state, id);

export const selectVehicleListLoading = (state: RootState) =>
  state.pages.vehicles.loading['getAll'] === LoadingState.Pending;

export const selectVehicleCreateLoading = (state: RootState) =>
  state.pages.vehicles.loading['create'] === LoadingState.Pending;

export const selectVehicleUpdateLoading = (id: string) => (state: RootState) =>
  state.pages.vehicles.loading[`update:${id}`] === LoadingState.Pending;

export const selectVehicleDeleteLoading = (id: string) => (state: RootState) =>
  state.pages.vehicles.loading[`delete:${id}`] === LoadingState.Pending;

export const selectVehicleDetailLoading = (id: string) => (state: RootState) =>
  state.pages.vehicles.loading[`getById:${id}`] === LoadingState.Pending;

export const selectFormattedVehicleById = (id: string | undefined) =>
  createSelector(
    [(state: RootState) => (id ? vehicleSelectors.selectById(state, id) : undefined)],
    (vehicle) => {
      if (!vehicle) return undefined;
      return {
        ...vehicle,
        createdAt: formatDate(vehicle.createdAt),
        updatedAt: formatDate(vehicle.updatedAt),
      };
    },
  );

export const selectVehicleWithCarrier = (vehicleId: string) =>
  createSelector(
    [
      (state: RootState) => vehicleSelectors.selectById(state, vehicleId),
      (state: RootState) => carrierSelectors.selectEntities(state),
      (state: RootState) => driverSelectors.selectEntities(state),
    ],
    (vehicle, carrierEntities, driverEntities) => {
      if (!vehicle) return undefined;
      const carrier = vehicle.carrierId ? carrierEntities[vehicle.carrierId] : undefined;
      const driver = vehicle.driverId ? driverEntities[vehicle.driverId] : undefined;
      return {
        ...vehicle,
        carrierName: carrier?.name ?? null,
        carrierType: carrier?.type ?? null,
        driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
      };
    },
  );

interface VehicleKpiItem {
  label: string;
  value: string;
  subtitle: string;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const selectVehicleKpis = createSelector(
  [selectAllVehicles],
  (vehicles): VehicleKpiItem[] => {
    const activeCount = vehicles.filter((vehicle) => vehicle.isActive).length;
    const carrierIds = new Set(vehicles.map((v) => v.carrierId).filter(Boolean));
    const carrierCount = carrierIds.size;
    const totalRevenue = 0;

    return [
      {
        label: 'Total Vehicles',
        value: String(vehicles.length),
        subtitle: `${activeCount} active`,
      },
      {
        label: 'Active Vehicles',
        value: String(activeCount),
        subtitle: 'Currently in service',
      },
      {
        label: 'Carrier Count',
        value: String(carrierCount),
        subtitle: 'Unique carriers',
      },
      {
        label: 'Revenue',
        value: currencyFormatter.format(totalRevenue),
        subtitle: 'Total lifetime revenue',
      },
    ];
  },
);

export const selectVehicleLoadHistory = (vehicleId: string) => (state: RootState) =>
  state.pages.vehicleLoadHistory.loadsByVehicleId[vehicleId] ?? [];

export const selectVehicleLoadHistoryLoading = (vehicleId: string) => (state: RootState) =>
  state.pages.vehicleLoadHistory.loading[`fetch:${vehicleId}`] === 'Pending';

export const selectDriversByCarrierId = (carrierId: string | null) =>
  createSelector(
    [(state: RootState) => driverSelectors.selectAll(state)],
    (drivers) => {
      if (!carrierId) return [];
      return drivers.filter((driver) => driver.carrierId === carrierId);
    },
  );

// ---------------------------------------------------------------------------
// List page filtering selectors
// ---------------------------------------------------------------------------

export type VehicleTab = 'all' | 'OWNED' | 'LEASED';

export const selectFilteredVehicles = (activeTab: VehicleTab) =>
  createSelector([selectAllVehicles], (vehicles) => {
    if (activeTab === 'all') {
      return [...vehicles];
    }
    return vehicles.filter((vehicle) => vehicle.ownership === activeTab);
  });

export const selectVehicleTabCounts = createSelector(
  [selectAllVehicles],
  (vehicles) => ({
    all: vehicles.length,
    OWNED: vehicles.filter((vehicle) => vehicle.ownership === 'OWNED').length,
    LEASED: vehicles.filter((vehicle) => vehicle.ownership === 'LEASED').length,
  }),
);
