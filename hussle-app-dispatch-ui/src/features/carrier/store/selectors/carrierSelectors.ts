import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { carrierSelectors } from '../reducers/carrierEntitySlice';

export const selectAllCarriers = (state: RootState) => carrierSelectors.selectAll(state);

export const selectCarrierById = (id: string) => (state: RootState) =>
  carrierSelectors.selectById(state, id);

export const selectCarrierListLoading = (state: RootState) =>
  state.pages.carrierPage.loading['getAll'] === LoadingState.Pending;

export const selectCarrierCreateLoading = (state: RootState) =>
  state.pages.carrierPage.loading['create'] === LoadingState.Pending;

export const selectCarrierUpdateLoading = (id: string) => (state: RootState) =>
  state.pages.carrierPage.loading[`update:${id}`] === LoadingState.Pending;

export const selectCarrierDeleteLoading = (id: string) => (state: RootState) =>
  state.pages.carrierPage.loading[`delete:${id}`] === LoadingState.Pending;

export const selectCarrierPagination = (state: RootState) => ({
  page: state.pages.carrierPage.page,
  limit: state.pages.carrierPage.limit,
  total: state.pages.carrierPage.total,
});

export const selectCarrierTypeFilter = (state: RootState) => state.pages.carrierPage.typeFilter;

export const selectCarrierCreateFulfilled = (state: RootState) =>
  state.pages.carrierPage.loading['create'] === LoadingState.Fulfilled;

export const selectCarrierUpdateFulfilled = (id: string) => (state: RootState) =>
  state.pages.carrierPage.loading[`update:${id}`] === LoadingState.Fulfilled;

export const selectCarrierDetailLoading = (id: string) => (state: RootState) =>
  state.pages.carrierPage.loading[`getById:${id}`] === LoadingState.Pending;

export const selectCarrierOnboarding = (id: string) => (state: RootState) =>
  state.pages.carrierPage.onboardingByCarrierId[id] ?? null;

export const selectCarrierOnboardingLoading = (id: string) => (state: RootState) =>
  state.pages.carrierPage.loading[`onboarding:${id}`] === LoadingState.Pending;
