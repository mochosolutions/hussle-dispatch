import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { settlementSelectors } from '../reducers/settlementEntitySlice';
import type {
  SettlementDetail,
  SettlementFilters,
  SettlementListItem,
} from '../../types';

// ---------------------------------------------------------------------------
// Entity selectors
// ---------------------------------------------------------------------------

export const selectAllSettlements = (state: RootState) => settlementSelectors.selectAll(state);

export const selectSettlementById = (id: string) => (state: RootState) =>
  settlementSelectors.selectById(state, id);

export const selectSettlementDetailById =
  (id: string) =>
  (state: RootState): SettlementDetail | undefined => {
    const entity = settlementSelectors.selectById(state, id);
    if (entity && 'lineItems' in entity) return entity as SettlementDetail;
    return undefined;
  };

// ---------------------------------------------------------------------------
// Page loading selectors
// ---------------------------------------------------------------------------

export const selectSettlementListLoading = (state: RootState) => {
  const status = state.pages.settlements.loading['getAll'];
  return status === undefined || status === LoadingState.Pending;
};

export const selectSettlementDetailLoading = (id: string) => (state: RootState) =>
  state.pages.settlements.loading[`getById:${id}`] === LoadingState.Pending;

// ---------------------------------------------------------------------------
// Filter selectors
// ---------------------------------------------------------------------------

export const selectSettlementFilters = (state: RootState): SettlementFilters =>
  state.pages.settlements.filters;

// ---------------------------------------------------------------------------
// Filtered + KPI selectors
// ---------------------------------------------------------------------------

const matchesFilters = (
  settlement: SettlementListItem,
  filters: SettlementFilters,
): boolean => {
  if (filters.status && settlement.status !== filters.status) {
    return false;
  }
  return true;
};

export const selectFilteredSettlements = createSelector(
  [selectAllSettlements, selectSettlementFilters],
  (settlements, filters) => settlements.filter((s) => matchesFilters(s, filters)),
);

export interface SettlementKpiItem {
  label: string;
  value: string | number;
  subtitle?: string;
}

export const selectSettlementKpis = createSelector(
  [selectFilteredSettlements],
  (settlements): SettlementKpiItem[] => {
    const total = settlements.length;
    const pendingCount = settlements.filter((s) => s.status === 'DRAFT').length;
    const approvedCount = settlements.filter((s) => s.status === 'APPROVED').length;
    const totalAmount = settlements.reduce(
      (sum, s) => sum + parseFloat(s.netEarnings ?? '0'),
      0,
    );
    return [
      { label: 'Total Settlements', value: String(total) },
      { label: 'Pending', value: String(pendingCount) },
      { label: 'Approved', value: String(approvedCount) },
      {
        label: 'Total Amount',
        value: `$${totalAmount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      },
    ];
  },
);
