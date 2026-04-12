import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { settlementSelectors } from '../reducers/settlementEntitySlice';
import type { SettlementDetail, SettlementFilters } from '../../types';

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

export const selectSettlementListLoading = (state: RootState) =>
  state.pages.settlements.loading['getAll'] === LoadingState.Pending;

export const selectSettlementDetailLoading = (id: string) => (state: RootState) =>
  state.pages.settlements.loading[`getById:${id}`] === LoadingState.Pending;

// ---------------------------------------------------------------------------
// Filter selectors
// ---------------------------------------------------------------------------

export const selectSettlementFilters = (state: RootState): SettlementFilters =>
  state.pages.settlements.filters;
