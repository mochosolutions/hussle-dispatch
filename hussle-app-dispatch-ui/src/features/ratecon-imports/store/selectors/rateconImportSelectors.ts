import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import type { RateconImport } from 'utils/api/ratecon-imports';
import { rateconImportEntitySelectors } from '../reducers/rateconImportEntitySlice';
import type { RateconImportFilters } from '../reducers/rateconImportPageSlice';

const selectPage = (state: RootState) => state.pages.rateconImports;

export const selectRateconFilters = (state: RootState): RateconImportFilters =>
  selectPage(state).filters;

export const selectRateconManualUploading = (state: RootState): boolean =>
  selectPage(state).manualUploading;

export const selectRateconHasLoadedOnce = (state: RootState): boolean =>
  selectPage(state).hasLoadedOnce;

// Per-import action loading (custom composite keys outside the CRUD operation set).
export const selectImportActionLoading =
  (action: 'accept' | 'reject' | 'retry' | 'review', id: string) =>
  (state: RootState): boolean =>
    selectPage(state).loading[`${action}:${id}`] === LoadingState.Pending;

// List pages pass loading={!hasLoadedOnce} so refetches don't flicker the grid.
export const selectRateconListLoading = (state: RootState): boolean => {
  const page = selectPage(state);
  return !page.hasLoadedOnce && page.loading['getAll'] !== LoadingState.Rejected;
};

export const selectAllRateconImports = rateconImportEntitySelectors.selectAll;

export const selectRateconImportById =
  (id: string | undefined) =>
  (state: RootState): RateconImport | undefined =>
    id ? rateconImportEntitySelectors.selectById(state, id) : undefined;

export const selectPendingReviewCount = createSelector(
  [selectAllRateconImports],
  (imports) => imports.filter((item) => item.status === 'PENDING_REVIEW').length,
);

const matchesSearch = (item: RateconImport, search: string): boolean => {
  const haystack = [item.brokerName, item.laneSummary, item.emailFrom, item.emailSubject]
    .filter((value): value is string => value !== null)
    .join(' ')
    .toLowerCase();
  return haystack.includes(search.toLowerCase());
};

export const selectFilteredRateconImports = createSelector(
  [selectAllRateconImports, selectRateconFilters],
  (imports, filters) =>
    imports.filter((item) => {
      if (filters.status !== undefined && item.status !== filters.status) {
        return false;
      }
      if (filters.source !== undefined && item.source !== filters.source) {
        return false;
      }
      if (
        filters.search !== undefined &&
        filters.search.trim().length > 0 &&
        !matchesSearch(item, filters.search.trim())
      ) {
        return false;
      }
      return true;
    }),
);
