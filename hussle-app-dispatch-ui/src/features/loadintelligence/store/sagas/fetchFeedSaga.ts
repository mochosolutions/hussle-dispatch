import { call, put, select, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getFeed } from 'utils/api/intel/loadIntelApi';
import { fetchFeedSuccess, fetchFeedFailure } from '../reducers/intelPageSlice';
import { selectFeedFilters, selectFeedSortBy, selectFeedPage } from '../selectors/intelSelectors';
import type { FeedFilters, FeedSortBy } from '../../types';

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

    yield put(
      fetchFeedSuccess({
        items: response.data,
        stats: response.stats,
        page,
        hasMore: response.meta.hasMore,
        append,
      }),
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load feed';
    yield put(fetchFeedFailure({ error: errorMessage }));
  }
}
