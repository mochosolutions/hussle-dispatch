import { createSelector } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import type { CarrierPageState } from '../reducers/carrierNewPageSlice';
import { carrierSelectors } from '../reducers/carrierEntitySlice';
import { driverSelectors } from '../../../driver/store/reducers/driverEntitySlice';
import { vehicleSelectors } from '../../../vehicle/store/reducers/vehicleEntitySlice';
import formatPhone from 'utils/formatPhone';

const DATE_FORMAT = 'MM/dd/yyyy';

const formatDate = (value: string | null) => (value ? format(new Date(value), DATE_FORMAT) : '');
const formatNullableDate = (value: string | null) =>
  value ? format(new Date(value), DATE_FORMAT) : null;

export const selectAllCarriers = (state: RootState) => carrierSelectors.selectAll(state);

export const selectCarrierById = (id: string) => (state: RootState) =>
  carrierSelectors.selectById(state, id);

export const selectCarrierListLoading = (state: RootState) => {
  const status = state.pages.carriers.loading['getAll'];
  return status === undefined || status === LoadingState.Pending;
};

export const selectCarrierCreateLoading = (state: RootState) =>
  state.pages.carriers.loading['create'] === LoadingState.Pending;

export const selectCarrierUpdateLoading = (id: string) => (state: RootState) =>
  state.pages.carriers.loading[`update:${id}`] === LoadingState.Pending;

export const selectCarrierDeleteLoading = (id: string) => (state: RootState) =>
  state.pages.carriers.loading[`delete:${id}`] === LoadingState.Pending;

export const selectCarrierCreateFulfilled = (state: RootState) =>
  state.pages.carriers.loading['create'] === LoadingState.Fulfilled;

export const selectCarrierUpdateFulfilled = (id: string) => (state: RootState) =>
  state.pages.carriers.loading[`update:${id}`] === LoadingState.Fulfilled;

export const selectCarrierDetailLoading = (id: string) => (state: RootState) =>
  state.pages.carriers.loading[`getById:${id}`] === LoadingState.Pending;

export const selectCarrierStats = (state: RootState) =>
  (state.pages.carriers as CarrierPageState).stats;

export const selectCarrierStatsLoading = (state: RootState) =>
  (state.pages.carriers as CarrierPageState).statsLoading;


export const selectFormattedCarrierById = (id: string | undefined) =>
  createSelector(
    [(state: RootState) => (id ? carrierSelectors.selectById(state, id) : undefined)],
    (carrier) => {
      if (!carrier) return undefined;
      return {
        ...carrier,
        phone: formatPhone(carrier.phone),
        createdAt: formatDate(carrier.createdAt),
        updatedAt: formatDate(carrier.updatedAt),
        insuranceExpiry: formatNullableDate(carrier.insuranceExpiry),
      };
    },
  );

export const selectCarrierNotes = (carrierId: string) => (state: RootState) =>
  state.pages.carrierNotes.notesByCarrierId[carrierId] ?? [];

export const selectCarrierNotesLoading = (carrierId: string) => (state: RootState) =>
  state.pages.carrierNotes.loading[`fetch:${carrierId}`] === 'Pending';

export const selectDriversByCarrierId = (carrierId: string) =>
  createSelector(
    [(state: RootState) => driverSelectors.selectAll(state)],
    (drivers) =>
      drivers
        .filter((d) => d.carrierId === carrierId)
        .map((d) => ({ ...d, phone: formatPhone(d.phone) })),
  );

export const selectVehiclesByCarrierId = (carrierId: string) =>
  createSelector(
    [(state: RootState) => vehicleSelectors.selectAll(state)],
    (vehicles) => vehicles.filter((v) => v.carrierId === carrierId),
  );

export const selectUserRole = (state: RootState) => state.auth.user?.role ?? '';

export interface CarrierKpiItem {
  label: string;
  value: string;
  subtitle: string;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

// ---------------------------------------------------------------------------
// List page filtering selectors
// ---------------------------------------------------------------------------

import { CARRIER_TAB_TO_STATUSES, type CarrierTab } from '../../constants';

export type { CarrierTab };

export const selectFilteredCarriers = (activeTab: CarrierTab) =>
  createSelector([selectAllCarriers], (carriers) => {
    const formatted = carriers.map((c) => ({ ...c, phone: formatPhone(c.phone) }));
    const statuses = CARRIER_TAB_TO_STATUSES[activeTab];
    if (statuses === undefined) {
      return formatted;
    }
    return formatted.filter((carrier) => statuses.includes(carrier.status));
  });

export const selectCarrierTabCounts = (state: RootState) =>
  (state.pages.carriers as CarrierPageState).tabCounts;

export const selectCarrierKpis = (activeTab: CarrierTab) =>
  createSelector(
    [selectFilteredCarriers(activeTab)],
    (carriers): CarrierKpiItem[] => {
      const activeCount = carriers.filter((carrier) => carrier.status === 'ACTIVE').length;
      const totalDrivers = carriers.reduce((sum, carrier) => sum + carrier.driverCount, 0);
      const totalVehicles = carriers.reduce((sum, carrier) => sum + carrier.vehicleCount, 0);
      const totalRevenue = carriers.reduce((sum) => sum + 0, 0);

      return [
        {
          label: 'Total Carriers',
          value: String(carriers.length),
          subtitle: `${activeCount} active`,
        },
        {
          label: 'Total Drivers',
          value: String(totalDrivers),
          subtitle: 'Across all carriers',
        },
        {
          label: 'Total Vehicles',
          value: String(totalVehicles),
          subtitle: 'Across all carriers',
        },
        {
          label: 'Lifetime Revenue',
          value: CURRENCY_FORMATTER.format(totalRevenue),
          subtitle: 'All carriers combined',
        },
      ];
    },
  );
