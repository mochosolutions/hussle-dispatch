import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import type { IntelPageState, LoadIntelFeedItem, FeedFilters, FeedStats, FeedSortBy } from '../../types';
import formatPhone from 'utils/formatPhone';

// ---------------------------------------------------------------------------
// Base page state selector
// ---------------------------------------------------------------------------

const selectIntelPage = (state: RootState): IntelPageState => state.pages.intel;

// ---------------------------------------------------------------------------
// Feed items
// ---------------------------------------------------------------------------

export const selectFeedItems = createSelector(
  [(state: RootState) => selectIntelPage(state).feedItems],
  (items) =>
    items.map((item) => ({
      ...item,
      customer: item.customer
        ? { ...item.customer, phone: formatPhone(item.customer.phone) }
        : item.customer,
    })),
);

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export const selectFeedFilters = (state: RootState): FeedFilters =>
  selectIntelPage(state).filters;

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

export const selectFeedSortBy = (state: RootState): FeedSortBy =>
  selectIntelPage(state).sortBy;

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export const selectFeedStats = (state: RootState): FeedStats | null =>
  selectIntelPage(state).stats;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const selectFeedPage = (state: RootState): number => selectIntelPage(state).page;

export const selectFeedHasMore = (state: RootState): boolean => selectIntelPage(state).hasMore;

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

export const selectFeedLoading = (state: RootState): boolean =>
  selectIntelPage(state).loading['fetchFeed'] === 'Pending';

export const selectManualEntryLoading = (state: RootState): boolean =>
  selectIntelPage(state).loading['manualEntry'] === 'Pending';

export const selectManualEntryFulfilled = (state: RootState): boolean =>
  selectIntelPage(state).loading['manualEntry'] === 'Fulfilled';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export const selectFeedError = (state: RootState): string =>
  selectIntelPage(state).error['fetchFeed'] ?? '';

// ---------------------------------------------------------------------------
// By ID
// ---------------------------------------------------------------------------

export const selectLoadIntelById = (id: string) =>
  createSelector([selectFeedItems], (items): LoadIntelFeedItem | undefined =>
    items.find((item) => item.id === id),
  );
