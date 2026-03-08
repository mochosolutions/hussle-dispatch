import { createSelector } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { vehicleSelectors } from '../reducers/vehicleEntitySlice';
import { carrierSelectors } from 'features/carrier/store/reducers/carrierEntitySlice';

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
    ],
    (vehicle, carrierEntities) => {
      if (!vehicle) return undefined;
      const carrier = vehicle.carrierId ? carrierEntities[vehicle.carrierId] : undefined;
      return {
        ...vehicle,
        carrierName: carrier?.name ?? null,
        carrierType: carrier?.type ?? null,
      };
    },
  );
