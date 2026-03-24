import { createSelector } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { driverSelectors } from '../reducers/driverEntitySlice';
import { carrierSelectors } from 'features/carrier/store/reducers/carrierEntitySlice';

const DATE_FORMAT = 'MM/dd/yyyy';

const formatDate = (value: string | null) => (value ? format(new Date(value), DATE_FORMAT) : '');
const formatNullableDate = (value: string | null) =>
  value ? format(new Date(value), DATE_FORMAT) : null;

export const selectAllDrivers = (state: RootState) => driverSelectors.selectAll(state);

export const selectDriverById = (id: string) => (state: RootState) =>
  driverSelectors.selectById(state, id);

export const selectDriverListLoading = (state: RootState) =>
  state.pages.drivers.loading['getAll'] === LoadingState.Pending;

export const selectDriverCreateLoading = (state: RootState) =>
  state.pages.drivers.loading['create'] === LoadingState.Pending;

export const selectDriverUpdateLoading = (id: string) => (state: RootState) =>
  state.pages.drivers.loading[`update:${id}`] === LoadingState.Pending;

export const selectDriverDeleteLoading = (id: string) => (state: RootState) =>
  state.pages.drivers.loading[`delete:${id}`] === LoadingState.Pending;

export const selectDriverDetailLoading = (id: string) => (state: RootState) =>
  state.pages.drivers.loading[`getById:${id}`] === LoadingState.Pending;

export const selectFormattedDriverById = (id: string | undefined) =>
  createSelector(
    [(state: RootState) => (id ? driverSelectors.selectById(state, id) : undefined)],
    (driver) => {
      if (!driver) return undefined;
      return {
        ...driver,
        createdAt: formatDate(driver.createdAt),
        updatedAt: formatDate(driver.updatedAt),
        cdlExpiry: formatNullableDate(driver.cdlExpiry),
      };
    },
  );

export const selectDriversByCarrierId = (carrierId: string) =>
  createSelector(
    [(state: RootState) => driverSelectors.selectAll(state)],
    (drivers) => drivers.filter((driver) => driver.carrierId === carrierId),
  );

interface DriverKpiItem {
  label: string;
  value: string;
  subtitle: string;
}

export const selectDriverKpis = createSelector([selectAllDrivers], (drivers): DriverKpiItem[] => {
  const availableCount = drivers.filter((driver) => driver.isAvailable).length;

  return [
    {
      label: 'Total Drivers',
      value: String(drivers.length),
      subtitle: `${availableCount} available`,
    },
    {
      label: 'Available Drivers',
      value: String(availableCount),
      subtitle: 'Ready for dispatch',
    },
    {
      label: 'Active Loads',
      value: '\u2014',
      subtitle: 'Currently on the road',
    },
    {
      label: 'Avg Days Out',
      value: '\u2014',
      subtitle: 'Average per trip',
    },
  ];
});

// ---------------------------------------------------------------------------
// List page filtering selectors
// ---------------------------------------------------------------------------

export type DriverTab = 'all' | 'available' | 'unavailable';

export const selectFilteredDrivers = (activeTab: DriverTab, carrierId: string) =>
  createSelector([selectAllDrivers], (drivers) => {
    let filtered = drivers;

    if (carrierId !== 'all') {
      filtered = filtered.filter((driver) => driver.carrierId === carrierId);
    }

    if (activeTab === 'available') {
      return filtered.filter((driver) => driver.isAvailable === true);
    }
    if (activeTab === 'unavailable') {
      return filtered.filter((driver) => driver.isAvailable === false);
    }
    return filtered;
  });

export const selectDriverTabCounts = createSelector(
  [selectAllDrivers],
  (drivers) => ({
    all: drivers.length,
    available: drivers.filter((driver) => driver.isAvailable === true).length,
    unavailable: drivers.filter((driver) => driver.isAvailable === false).length,
  }),
);

export const selectDriverWithCarrier = (driverId: string) =>
  createSelector(
    [
      (state: RootState) => driverSelectors.selectById(state, driverId),
      (state: RootState) => carrierSelectors.selectEntities(state),
    ],
    (driver, carrierEntities) => {
      if (!driver) return undefined;
      const carrier = driver.carrierId ? carrierEntities[driver.carrierId] : undefined;
      return {
        ...driver,
        carrierName: carrier?.name ?? null,
        carrierType: carrier?.type ?? null,
        dispatchFeePercent: carrier?.dispatchFeePercent ?? null,
      };
    },
  );
