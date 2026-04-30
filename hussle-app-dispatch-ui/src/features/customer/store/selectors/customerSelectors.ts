import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { customerSelectors } from '../reducers/customerEntitySlice';
import type { CustomerPageState } from '../reducers/customerPageSlice';
import type { CustomerFilters } from '../../types';
import formatPhone from 'utils/formatPhone';

export const selectAllCustomers = (state: RootState) => customerSelectors.selectAll(state);

export const selectCustomerById = (id: string) => (state: RootState) =>
  customerSelectors.selectById(state, id);

export const selectCustomerListLoading = (state: RootState) => {
  const status = state.pages.customers.loading['getAll'];
  return status === undefined || status === LoadingState.Pending;
};

export const selectCustomerCreateLoading = (state: RootState) =>
  state.pages.customers.loading['create'] === LoadingState.Pending;

export const selectCustomerUpdateLoading = (id: string) => (state: RootState) =>
  state.pages.customers.loading[`update:${id}`] === LoadingState.Pending;

export const selectCustomerDeleteLoading = (id: string) => (state: RootState) =>
  state.pages.customers.loading[`delete:${id}`] === LoadingState.Pending;

export const selectCustomerCreateFulfilled = (state: RootState) =>
  state.pages.customers.loading['create'] === LoadingState.Fulfilled;

export const selectCustomerUpdateFulfilled = (id: string) => (state: RootState) =>
  state.pages.customers.loading[`update:${id}`] === LoadingState.Fulfilled;

export const selectCustomerDetailLoading = (id: string) => (state: RootState) =>
  state.pages.customers.loading[`getById:${id}`] === LoadingState.Pending;

export const selectCustomerError = (state: RootState) =>
  state.pages.customers.errors['getAll'] ?? null;

export const selectCustomerStats = (state: RootState) =>
  (state.pages.customers as CustomerPageState).stats;

export const selectCustomerStatsLoading = (state: RootState) =>
  (state.pages.customers as CustomerPageState).statsLoading;

export const selectCustomerFilters = (state: RootState): CustomerFilters =>
  (state.pages.customers as CustomerPageState).filters;

export const selectFilteredCustomers = createSelector(
  [selectAllCustomers, selectCustomerFilters],
  (customers, filters) => {
    let result = customers;

    if (filters.type) {
      result = result.filter((c) => c.type === filters.type);
    }

    if (filters.status) {
      result = result.filter((c) => c.status === filters.status);
    }

    return result;
  },
);

export const selectFormattedCustomerById = (id: string | undefined) =>
  createSelector(
    [(state: RootState) => (id ? customerSelectors.selectById(state, id) : undefined)],
    (customer) => {
      if (!customer) return undefined;
      return {
        ...customer,
        phone: formatPhone(customer.phone),
      };
    },
  );

export interface CustomerKpiItem {
  label: string;
  value: string;
  subtitle?: string;
}

export const selectCustomerKpis = createSelector(
  [selectFilteredCustomers],
  (customers): CustomerKpiItem[] => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === 'ACTIVE').length;
    const totalLoads = customers.reduce((sum, c) => sum + (c._count?.loads ?? 0), 0);
    return [
      { label: 'Total Customers', value: String(total) },
      { label: 'Active', value: String(active), subtitle: `${total - active} inactive` },
      { label: 'Total Loads', value: String(totalLoads) },
      { label: 'Total Revenue', value: '—' },
    ];
  },
);
