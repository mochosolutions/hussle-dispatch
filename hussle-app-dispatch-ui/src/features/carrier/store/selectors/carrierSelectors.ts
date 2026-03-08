import { createSelector } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { carrierSelectors } from '../reducers/carrierEntitySlice';

const DATE_FORMAT = 'MM/dd/yyyy';

const formatDate = (value: string | null) => (value ? format(new Date(value), DATE_FORMAT) : '');
const formatNullableDate = (value: string | null) =>
  value ? format(new Date(value), DATE_FORMAT) : null;

export const selectAllCarriers = (state: RootState) => carrierSelectors.selectAll(state);

export const selectCarrierById = (id: string) => (state: RootState) =>
  carrierSelectors.selectById(state, id);

export const selectCarrierListLoading = (state: RootState) =>
  state.pages.carriers.loading['getAll'] === LoadingState.Pending;

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


export const selectFormattedCarrierById = (id: string | undefined) =>
  createSelector(
    [(state: RootState) => (id ? carrierSelectors.selectById(state, id) : undefined)],
    (carrier) => {
      if (!carrier) return undefined;
      return {
        ...carrier,
        createdAt: formatDate(carrier.createdAt),
        updatedAt: formatDate(carrier.updatedAt),
        insuranceExpiry: formatNullableDate(carrier.insuranceExpiry),
      };
    },
  );
