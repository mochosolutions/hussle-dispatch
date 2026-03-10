import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { DashboardKpis, WeeklyGrossItem, AttentionItem } from '../../types';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface DashboardState {
  kpis: DashboardKpis | null;
  weeklyGross: WeeklyGrossItem[];
  attentionItems: AttentionItem[];
  loading: Record<string, string>;
  error: Record<string, string>;
}

const initialState: DashboardState = {
  kpis: null,
  weeklyGross: [],
  attentionItems: [],
  loading: {},
  error: {},
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // KPIs
    fetchKpisRequest(state) {
      state.loading['kpis'] = 'Pending';
      state.error['kpis'] = '';
    },
    fetchKpisSuccess(state, action: PayloadAction<DashboardKpis>) {
      state.kpis = action.payload;
      state.loading['kpis'] = 'Fulfilled';
      state.error['kpis'] = '';
    },
    fetchKpisFailure(state, action: PayloadAction<{ error: string }>) {
      state.loading['kpis'] = 'Rejected';
      state.error['kpis'] = action.payload.error;
    },

    // Weekly Gross
    fetchWeeklyGrossRequest(state) {
      state.loading['weeklyGross'] = 'Pending';
      state.error['weeklyGross'] = '';
    },
    fetchWeeklyGrossSuccess(state, action: PayloadAction<WeeklyGrossItem[]>) {
      state.weeklyGross = action.payload;
      state.loading['weeklyGross'] = 'Fulfilled';
      state.error['weeklyGross'] = '';
    },
    fetchWeeklyGrossFailure(state, action: PayloadAction<{ error: string }>) {
      state.loading['weeklyGross'] = 'Rejected';
      state.error['weeklyGross'] = action.payload.error;
    },

    // Attention Items
    fetchAttentionItemsRequest(state) {
      state.loading['attentionItems'] = 'Pending';
      state.error['attentionItems'] = '';
    },
    fetchAttentionItemsSuccess(state, action: PayloadAction<AttentionItem[]>) {
      state.attentionItems = action.payload;
      state.loading['attentionItems'] = 'Fulfilled';
      state.error['attentionItems'] = '';
    },
    fetchAttentionItemsFailure(state, action: PayloadAction<{ error: string }>) {
      state.loading['attentionItems'] = 'Rejected';
      state.error['attentionItems'] = action.payload.error;
    },
  },
});

export const {
  fetchKpisRequest,
  fetchKpisSuccess,
  fetchKpisFailure,
  fetchWeeklyGrossRequest,
  fetchWeeklyGrossSuccess,
  fetchWeeklyGrossFailure,
  fetchAttentionItemsRequest,
  fetchAttentionItemsSuccess,
  fetchAttentionItemsFailure,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
