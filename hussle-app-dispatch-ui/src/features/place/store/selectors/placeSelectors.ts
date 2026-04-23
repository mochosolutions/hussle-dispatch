import { createSelector } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { placeSelectors } from '../reducers/placeEntitySlice';
import formatPhone from 'utils/formatPhone';

const DATE_FORMAT = 'MM/dd/yyyy';

const formatDate = (value: string | null) => (value ? format(new Date(value), DATE_FORMAT) : '');

export const selectAllPlaces = (state: RootState) => placeSelectors.selectAll(state);

export const selectPlaceById = (id: string) => (state: RootState) =>
  placeSelectors.selectById(state, id);

export const selectPlaceListLoading = (state: RootState) => {
  const status = state.pages.places.loading['getAll'];
  return status === undefined || status === LoadingState.Pending;
};

export const selectPlaceCreateLoading = (state: RootState) =>
  state.pages.places.loading['create'] === LoadingState.Pending;

export const selectPlaceUpdateLoading = (id: string) => (state: RootState) =>
  state.pages.places.loading[`update:${id}`] === LoadingState.Pending;

export const selectPlaceDeleteLoading = (id: string) => (state: RootState) =>
  state.pages.places.loading[`delete:${id}`] === LoadingState.Pending;

export const selectFormattedPlaces = createSelector(
  [selectAllPlaces],
  (places) => places.map((p) => ({ ...p, contactPhone: formatPhone(p.contactPhone) })),
);

export const selectFormattedPlaceById = (id: string | undefined) =>
  createSelector(
    [(state: RootState) => (id ? placeSelectors.selectById(state, id) : undefined)],
    (place) => {
      if (!place) {
        return undefined;
      }
      return {
        ...place,
        contactPhone: formatPhone(place.contactPhone),
        createdAt: formatDate(place.createdAt),
        updatedAt: formatDate(place.updatedAt),
      };
    },
  );
