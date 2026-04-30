import { createSelector } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import type { PlacePageState } from '../reducers/placePageSlice';
import { placeSelectors } from '../reducers/placeEntitySlice';
import { FACILITY_TYPE_LABELS } from '../../constants';
import type { FacilityType } from '../../types';
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

export const selectPlaceStats = (state: RootState) =>
  (state.pages.places as PlacePageState).stats;

export const selectPlaceStatsLoading = (state: RootState) =>
  (state.pages.places as PlacePageState).statsLoading;

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

export const selectFilteredPlaces = (facilityType: string) =>
  createSelector([selectFormattedPlaces], (places) => {
    if (facilityType === 'all') {
      return places;
    }
    return places.filter((p) => p.facilityType === facilityType);
  });

export interface PlaceKpiItem {
  label: string;
  value: string | number;
  subtitle?: string;
}

export const selectPlaceKpis = (facilityType: string) =>
  createSelector([selectFilteredPlaces(facilityType)], (places): PlaceKpiItem[] => {
    const counts = places.reduce<Partial<Record<FacilityType, number>>>((acc, place) => {
      if (place.facilityType) {
        acc[place.facilityType] = (acc[place.facilityType] ?? 0) + 1;
      }
      return acc;
    }, {});

    const topTypes = Object.entries(counts)
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
      .slice(0, 3)
      .map(([type, count]) => ({
        label: FACILITY_TYPE_LABELS[type as FacilityType],
        value: count ?? 0,
      }));

    return [{ label: 'Total Places', value: places.length }, ...topTypes];
  });
