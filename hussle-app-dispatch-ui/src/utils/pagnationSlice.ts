import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LoadingState } from 'types/loadingState';

/* ────────────────────────────────────────────────────────────────────────── */
/* 1) Offset (page/size) pagination metadata slice factory                  */
/* ────────────────────────────────────────────────────────────────────────── */

export interface OffsetPaginationState {
  page: number;
  pageSize: number;
  total: number;
  status: LoadingState;
  error?: string;
}

/**
 * Creates a slice that tracks offset-pagination metadata.
 * Entities themselves are managed elsewhere.
 */
export function createOffsetPaginationSlice(sliceName: string) {
  const initialState: OffsetPaginationState = {
    page: 1,
    pageSize: 25,
    total: 0,
    status: LoadingState.Idle,
    error: undefined,
  };

  const slice = createSlice({
    name: sliceName,
    initialState,
    reducers: {
      /** Start loading page `page`. Optionally override pageSize. */
      fetchPageRequest(
        state,
        action: PayloadAction<{ page: number; pageSize?: number }>
      ) {
        state.status = LoadingState.Pending;
        state.error = undefined;
        state.page = action.payload.page;
        if (action.payload.pageSize !== undefined) {
          state.pageSize = action.payload.pageSize;
        }
      },
      /** On success, set the total count and mark fulfilled. */
      fetchPageSuccess(
        state,
        action: PayloadAction<{ total: number }>
      ) {
        state.total = action.payload.total;
        state.status = LoadingState.Fulfilled;
      },
      /** On failure, record error and mark rejected. */
      fetchPageFailure(
        state,
        action: PayloadAction<{ message: string }>
      ) {
        state.status = LoadingState.Rejected;
        state.error = action.payload.message;
      },
      /** Reset all pagination metadata back to initial. */
      resetPage(state) {
        state.page = 1;
        state.total = 0;
        state.status = LoadingState.Idle;
        state.error = undefined;
      },
    },
  });

  return {
    reducer: slice.reducer,
    actions: slice.actions,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 2) Cursor (keyset) pagination metadata slice factory                     */
/* ────────────────────────────────────────────────────────────────────────── */

export interface CursorPaginationState {
  nextCursor?: string;
  hasNext: boolean;
  totalCount: number;
  pageSize: number;
  status: LoadingState;
  error?: string;
}

/**
 * Creates a slice that tracks cursor-pagination metadata.
 * Entities themselves (ids + data) are managed in a separate slice.
 */
export function createCursorPaginationSlice(sliceName: string) {
  const initialState: CursorPaginationState = {
    nextCursor: undefined,
    hasNext: false,
    totalCount: 0,
    pageSize: 25,
    status: LoadingState.Idle,
    error: undefined,
  };

  const slice = createSlice({
    name: sliceName,
    initialState,
    reducers: {
      /** Clear old cursor data and start fetching first batch. */
      fetchFirstRequest(
        state,
        action: PayloadAction<{ pageSize?: number } | undefined>
      ) {
        state.status = LoadingState.Pending;
        state.error = undefined;
        state.nextCursor = undefined;
        state.hasNext = false;
        state.totalCount = 0;
        if (action.payload?.pageSize !== undefined) {
          state.pageSize = action.payload.pageSize;
        }
      },
      /** Start loading the next batch—append mode. */
      fetchNextRequest(state) {
        state.status = LoadingState.Pending;
        state.error = undefined;
      },
      /** On success, update cursor, flags, and totalCount. */
      fetchSuccess(
        state,
        action: PayloadAction<{
          nextCursor?: string;
          hasNext: boolean;
          totalCount: number;
          append: boolean; // note: entities are merged elsewhere
        }>
      ) {
        state.nextCursor = action.payload.nextCursor;
        state.hasNext = action.payload.hasNext;
        state.totalCount = action.payload.totalCount;
        state.status = LoadingState.Fulfilled;
      },
      /** On failure, record error and mark rejected. */
      fetchFailure(
        state,
        action: PayloadAction<{ message: string }>
      ) {
        state.status = LoadingState.Rejected;
        state.error = action.payload.message;
      },
      /** Reset all cursor metadata back to initial. */
      resetCursor(state) {
        state.nextCursor = undefined;
        state.hasNext = false;
        state.totalCount = 0;
        state.status = LoadingState.Idle;
        state.error = undefined;
      },
      /** Change pageSize for future requests (does not auto‑trigger). */
      setPageSize(state, action: PayloadAction<number>) {
        state.pageSize = action.payload;
      },
    },
  });

  return {
    reducer: slice.reducer,
    actions: slice.actions,
  };
}
