import type { RootState } from 'store';
import type { IftaFilters } from '../reducers/iftaPageSlice';
import type { IftaReportResponse } from '../../types';

// ---------------------------------------------------------------------------
// Simple state selectors
// ---------------------------------------------------------------------------

export const selectIftaReport = (state: RootState): IftaReportResponse | null =>
  state.pages.ifta.report;

export const selectIftaLoading = (state: RootState): boolean => state.pages.ifta.loading;

export const selectIftaError = (state: RootState): string | null => state.pages.ifta.error;

export const selectIftaFilters = (state: RootState): IftaFilters => state.pages.ifta.filters;

export const selectIftaHasLoadedOnce = (state: RootState): boolean =>
  state.pages.ifta.hasLoadedOnce;

export const selectIftaLastFetchedAt = (state: RootState): number | null =>
  state.pages.ifta.lastFetchedAt;
