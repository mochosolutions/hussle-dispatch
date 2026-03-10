import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  IntelPageState,
  LoadIntelFeedItem,
  FeedFilters,
  FeedStats,
  FeedSortBy,
  BookLoadResult,
  BookChainResult,
  ManualEntryInput,
} from '../../types';

// ---------------------------------------------------------------------------
// Default filter state
// ---------------------------------------------------------------------------

export const DEFAULT_FILTERS: FeedFilters = {
  scoreTier: 'All',
  equipmentTypes: [],
  originState: '',
  destinationState: '',
  marketStrength: 'All',
  hasRate: 'all',
  source: 'All',
  search: '',
  vehicleId: null,
};

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: IntelPageState = {
  feedItems: [],
  filters: DEFAULT_FILTERS,
  sortBy: 'score',
  stats: null,
  page: 1,
  hasMore: true,
  loading: {},
  error: {},
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const intelPageSlice = createSlice({
  name: 'intelPage',
  initialState,
  reducers: {
    // --- Feed ---
    fetchFeedRequest(state, _action: PayloadAction<{ page?: number } | undefined>) {
      state.loading['fetchFeed'] = 'Pending';
      state.error['fetchFeed'] = '';
    },
    fetchFeedSuccess(
      state,
      action: PayloadAction<{
        items: LoadIntelFeedItem[];
        stats: FeedStats;
        page: number;
        hasMore: boolean;
        append: boolean;
      }>,
    ) {
      const { items, stats, page, hasMore, append } = action.payload;
      state.feedItems = append ? [...state.feedItems, ...items] : items;
      state.stats = stats;
      state.page = page;
      state.hasMore = hasMore;
      state.loading['fetchFeed'] = 'Fulfilled';
    },
    fetchFeedFailure(state, action: PayloadAction<{ error: string }>) {
      state.loading['fetchFeed'] = 'Rejected';
      state.error['fetchFeed'] = action.payload.error;
    },

    // --- Chains ---
    fetchChainsRequest(_state, _action: PayloadAction<{ id: string; vehicleId?: string }>) {
      // saga handles loading per-item
    },
    fetchChainsSuccess(
      state,
      action: PayloadAction<{ id: string; chain: LoadIntelFeedItem['chain'] }>,
    ) {
      const item = state.feedItems.find((fi) => fi.id === action.payload.id);
      if (item) {
        item.chain = action.payload.chain;
      }
    },
    fetchChainsFailure(_state, _action: PayloadAction<{ id: string; error: string }>) {
      // No-op for now; per-item error
    },

    // --- Dismiss ---
    dismissLoadRequest(_state, _action: PayloadAction<{ id: string }>) {
      // saga handles
    },
    dismissLoadSuccess(state, action: PayloadAction<{ id: string }>) {
      state.feedItems = state.feedItems.filter((item) => item.id !== action.payload.id);
      if (state.stats) {
        state.stats.totalLoads -= 1;
      }
    },
    dismissLoadFailure(_state, _action: PayloadAction<{ id: string; error: string }>) {
      // No-op
    },

    // --- Book Load ---
    bookLoadRequest(_state, _action: PayloadAction<{ id: string }>) {
      // saga handles
    },
    bookLoadSuccess(_state, _action: PayloadAction<BookLoadResult>) {
      // saga navigates
    },
    bookLoadFailure(_state, _action: PayloadAction<{ error: string }>) {
      // No-op
    },

    // --- Book Chain ---
    bookChainRequest(_state, _action: PayloadAction<{ id: string }>) {
      // saga handles
    },
    bookChainSuccess(_state, _action: PayloadAction<BookChainResult>) {
      // saga navigates
    },
    bookChainFailure(_state, _action: PayloadAction<{ error: string }>) {
      // No-op
    },

    // --- Manual Entry ---
    submitManualEntryRequest(_state, _action: PayloadAction<{ data: ManualEntryInput }>) {
      state.loading['manualEntry'] = 'Pending';
      state.error['manualEntry'] = '';
    },
    submitManualEntrySuccess(state, action: PayloadAction<{ item: LoadIntelFeedItem }>) {
      state.feedItems = [action.payload.item, ...state.feedItems];
      state.loading['manualEntry'] = 'Fulfilled';
      if (state.stats) {
        state.stats.totalLoads += 1;
        state.stats.sourceCounts.Manual = (state.stats.sourceCounts.Manual ?? 0) + 1;
      }
    },
    submitManualEntryFailure(state, action: PayloadAction<{ error: string }>) {
      state.loading['manualEntry'] = 'Rejected';
      state.error['manualEntry'] = action.payload.error;
    },

    // --- Filters & Sort ---
    setFilters(state, action: PayloadAction<Partial<FeedFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
      state.hasMore = true;
    },
    setSortBy(state, action: PayloadAction<FeedSortBy>) {
      state.sortBy = action.payload;
      state.page = 1;
      state.hasMore = true;
    },
  },
});

export const {
  fetchFeedRequest,
  fetchFeedSuccess,
  fetchFeedFailure,
  fetchChainsRequest,
  fetchChainsSuccess,
  fetchChainsFailure,
  dismissLoadRequest,
  dismissLoadSuccess,
  dismissLoadFailure,
  bookLoadRequest,
  bookLoadSuccess,
  bookLoadFailure,
  bookChainRequest,
  bookChainSuccess,
  bookChainFailure,
  submitManualEntryRequest,
  submitManualEntrySuccess,
  submitManualEntryFailure,
  setFilters,
  setSortBy,
} = intelPageSlice.actions;

export default intelPageSlice;
