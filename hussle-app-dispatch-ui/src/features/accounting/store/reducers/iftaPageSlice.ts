import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { IftaReportResponse } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IftaFilters {
  year: number;
  quarter: number;
  vehicleId?: string;
}

export interface IftaPageState {
  report: IftaReportResponse | null;
  loading: boolean;
  error: string | null;
  filters: IftaFilters;
  hasLoadedOnce: boolean;
  lastFetchedAt: number | null;
}

// ---------------------------------------------------------------------------
// Initial state — defaults to current year + current quarter
// ---------------------------------------------------------------------------

const getCurrentQuarter = (): number => Math.ceil((new Date().getMonth() + 1) / 3);

const initialState: IftaPageState = {
  report: null,
  loading: false,
  error: null,
  filters: {
    year: new Date().getFullYear(),
    quarter: getCurrentQuarter(),
    vehicleId: undefined,
  },
  hasLoadedOnce: false,
  lastFetchedAt: null,
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

export const iftaPageSlice = createSlice({
  name: 'ifta',
  initialState,
  reducers: {
    fetchIftaReportRequest: (state, _action: PayloadAction<IftaFilters>) => {
      state.loading = true;
      state.error = null;
    },
    fetchIftaReportSuccess: (state, action: PayloadAction<IftaReportResponse>) => {
      state.report = action.payload;
      state.loading = false;
      state.error = null;
      state.hasLoadedOnce = true;
      state.lastFetchedAt = Date.now();
    },
    fetchIftaReportFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setIftaFilters: (state, action: PayloadAction<Partial<IftaFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const {
  fetchIftaReportRequest,
  fetchIftaReportSuccess,
  fetchIftaReportFailure,
  setIftaFilters,
} = iftaPageSlice.actions;

export const iftaPageReducer = iftaPageSlice.reducer;
