import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { loadSelectors } from '../reducers/loadEntitySlice';
import { STATUS_TO_KANBAN_GROUP } from '../../constants';
import type { BoardView, KanbanGroup, LoadFilters, LoadListItem } from '../../types';

// ---------------------------------------------------------------------------
// Entity selectors
// ---------------------------------------------------------------------------

export const selectAllLoads = (state: RootState) => loadSelectors.selectAll(state);

export const selectLoadById = (id: string) => (state: RootState) =>
  loadSelectors.selectById(state, id);

// ---------------------------------------------------------------------------
// Page loading selectors
// ---------------------------------------------------------------------------

export const selectLoadListLoading = (state: RootState) =>
  state.pages.loads.loading['getAll'] === LoadingState.Pending;

export const selectLoadCreateLoading = (state: RootState) =>
  state.pages.loads.loading['create'] === LoadingState.Pending;

export const selectLoadUpdateLoading = (id: string) => (state: RootState) =>
  state.pages.loads.loading[`update:${id}`] === LoadingState.Pending;

export const selectLoadDetailLoading = (id: string) => (state: RootState) =>
  state.pages.loads.loading[`getById:${id}`] === LoadingState.Pending;

export const selectLoadCreateFulfilled = (state: RootState) =>
  state.pages.loads.loading['create'] === LoadingState.Fulfilled;

export const selectLoadUpdateFulfilled = (id: string) => (state: RootState) =>
  state.pages.loads.loading[`update:${id}`] === LoadingState.Fulfilled;

// ---------------------------------------------------------------------------
// Board view selector
// ---------------------------------------------------------------------------

// Board view and filters are stored via custom actions; the crudSlice doesn't
// manage them, so we read from page state and fall back to defaults.
export const selectBoardView = (state: RootState): BoardView =>
  (state.pages.loads as Record<string, unknown>).boardView as BoardView ?? 'table';

export const selectLoadFilters = (state: RootState): LoadFilters =>
  (state.pages.loads as Record<string, unknown>).filters as LoadFilters ?? {};

// ---------------------------------------------------------------------------
// Kanban grouping selector
// ---------------------------------------------------------------------------

export const selectLoadsByKanbanGroup = createSelector(
  [selectAllLoads],
  (loads): Record<KanbanGroup, LoadListItem[]> => {
    const groups: Record<KanbanGroup, LoadListItem[]> = {
      NEW: [],
      BOOKED: [],
      ACTIVE: [],
      DELIVERED: [],
      COMPLETE: [],
      ISSUES: [],
    };

    loads.forEach((load) => {
      const group = STATUS_TO_KANBAN_GROUP[load.status] ?? 'ISSUES';
      groups[group].push(load);
    });

    return groups;
  },
);
