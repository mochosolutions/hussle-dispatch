import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { FeedMeta, LoadBoardSource, StagedLoad } from '../../types/loadBoardTypes';

interface LoadBoardState {
  loads: StagedLoad[];
  meta: FeedMeta | null;
  sourceFilter: 'all' | LoadBoardSource;
  loading: boolean;
  error: string | null;
  datIngesting: boolean;
}

const initialState: LoadBoardState = {
  loads: [],
  meta: null,
  sourceFilter: 'all',
  loading: false,
  error: null,
  datIngesting: false,
};

const loadBoardSlice = createSlice({
  name: 'loadBoard',
  initialState,
  reducers: {
    fetchFeedRequest: (state) => {
      state.loading = true;
    },
    fetchFeedSuccess: (state, action: PayloadAction<{ loads: StagedLoad[]; meta: FeedMeta }>) => {
      state.loading = false;
      state.loads = action.payload.loads;
      state.meta = action.payload.meta;
    },
    fetchFeedFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSourceFilter: (state, action: PayloadAction<'all' | LoadBoardSource>) => {
      state.sourceFilter = action.payload;
    },
    ingestDatRequest: (state) => {
      state.datIngesting = true;
    },
    ingestDatSuccess: (state) => {
      state.datIngesting = false;
    },
    ingestDatFailure: (state, action: PayloadAction<string>) => {
      state.datIngesting = false;
      state.error = action.payload;
    },
    startPolling: (_state) => {
      // Saga-only action — no state change needed
      return _state;
    },
    stopPolling: (_state) => {
      // Saga-only action — no state change needed
      return _state;
    },
  },
});

export const {
  fetchFeedRequest,
  fetchFeedSuccess,
  fetchFeedFailure,
  setSourceFilter,
  ingestDatRequest,
  ingestDatSuccess,
  ingestDatFailure,
  startPolling,
  stopPolling,
} = loadBoardSlice.actions;

export const loadBoardReducer = loadBoardSlice.reducer;

export default loadBoardSlice;
