import { call, put, select, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getFeed } from 'utils/api/intel/loadIntelApi';
import { fetchFeedSuccess, fetchFeedFailure } from '../reducers/intelPageSlice';
import { selectFeedFilters, selectFeedSortBy, selectFeedPage } from '../selectors/intelSelectors';
import type { FeedFilters, FeedSortBy, LoadIntelFeedItem, FeedStats, SourceType } from '../../types';
import { MOCK_LOADS } from '../../mockData';

// TODO: Remove mock fallback once load-intel API is connected
const getMarketStrength = (score: number): 'Hot' | 'Balanced' | 'Soft' | 'Dead' => {
  if (score >= 80) return 'Hot';
  if (score >= 60) return 'Balanced';
  if (score >= 40) return 'Soft';
  return 'Dead';
};

const buildMockFeedItems = (): LoadIntelFeedItem[] =>
  MOCK_LOADS.map((load) => ({
    ...load,
    minBookRate: (load as Record<string, unknown>).minRate as number | null ?? null,
    bestTruck: null,
    truckBreakdown: [],
    marketStrength: getMarketStrength(load.market?.score ?? 0),
  }));

const buildMockStats = (items: LoadIntelFeedItem[]): FeedStats => {
  const sourceCounts: Record<SourceType, number> = { DAT: 0, Bulk: 0, Manual: 0 };
  items.forEach((item) => {
    const type = item.source?.type;
    if (type && type in sourceCounts) {
      sourceCounts[type] += 1;
    }
  });
  const scores = items.map((i) => i.score);
  return {
    totalLoads: items.length,
    sourceCount: Object.values(sourceCounts).filter((c) => c > 0).length,
    sourceCounts,
    avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
  };
};

export function* fetchFeedSaga(
  action: PayloadAction<{ page?: number } | undefined>,
): Generator {
  try {
    const requestedPage = action.payload?.page;
    const filters = (yield select(selectFeedFilters)) as FeedFilters;
    const sortBy = (yield select(selectFeedSortBy)) as FeedSortBy;
    const currentPage = (yield select(selectFeedPage)) as number;

    const page = requestedPage ?? 1;
    const append = page > 1 && page > currentPage;

    const response = (yield call(getFeed, filters, page, 25, sortBy)) as SagaReturnType<
      typeof getFeed
    >;

    const items = response.data.length > 0 ? response.data : buildMockFeedItems();
    const stats = response.data.length > 0 ? response.stats : buildMockStats(items);

    yield put(
      fetchFeedSuccess({
        items,
        stats,
        page,
        hasMore: response.data.length > 0 ? response.meta.hasMore : false,
        append,
      }),
    );
  } catch (error: unknown) {
    // Fall back to mock data so the Intel view is usable during development
    const mockItems = buildMockFeedItems();
    yield put(
      fetchFeedSuccess({
        items: mockItems,
        stats: buildMockStats(mockItems),
        page: 1,
        hasMore: false,
        append: false,
      }),
    );
    const errorMessage = error instanceof Error ? error.message : 'Failed to load feed';
    yield put(fetchFeedFailure({ error: errorMessage }));
  }
}
