import { createAction } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';
import type { CrudPageState } from '@mocho/ui/redux';
import type { BoardView, LoadFilters, LoadStatus, TransitionStatusInput } from '../../types';

// ---------------------------------------------------------------------------
// Extended state — adds boardView and filters to the standard CRUD page state
// ---------------------------------------------------------------------------

export interface LoadPageState extends CrudPageState {
  boardView: BoardView;
  filters: LoadFilters;
  lastRefreshed: string | null;
}

const loadPageInitialExtras: Pick<LoadPageState, 'boardView' | 'filters' | 'lastRefreshed'> = {
  boardView: 'table',
  filters: {},
  lastRefreshed: null,
};

export const loadPageSlice = createCrudSlice({
  name: 'load',
  entityName: 'load',
  entityNamePlural: 'loads',
});

export const loadPageSelectors = createCrudSelectors<RootState>((state) => state.pages.loads);

// ---------------------------------------------------------------------------
// Wrapper reducer — delegates to crudSlice, then handles custom actions
// ---------------------------------------------------------------------------

const crudReducer = loadPageSlice.reducer;

const initialState: LoadPageState = {
  ...crudReducer(undefined, { type: '@@INIT' }),
  ...loadPageInitialExtras,
};

export const loadPageReducer = (
  state: LoadPageState = initialState,
  action: UnknownAction,
): LoadPageState => {
  // Handle custom actions first
  if (setBoardView.match(action)) {
    return { ...state, boardView: action.payload };
  }

  if (setLoadFilters.match(action)) {
    return { ...state, filters: action.payload };
  }

  if (fetchLoadsSuccess.match(action)) {
    const nextCrud = crudReducer(state, action);
    return { ...nextCrud, boardView: state.boardView, filters: state.filters, lastRefreshed: new Date().toISOString() };
  }

  // Delegate all other actions to the CRUD slice reducer
  const nextCrudState = crudReducer(state, action);

  // If the CRUD reducer returned the same reference, no change — return current state
  if (nextCrudState === state) {
    return state;
  }

  // Merge CRUD state changes while preserving custom fields
  return {
    ...nextCrudState,
    boardView: state.boardView,
    filters: state.filters,
    lastRefreshed: state.lastRefreshed,
  };
};

// Semantic action aliases — match the naming convention used by sagas and barrel exports
export const {
  fetchAllRequest: fetchLoadsRequest,
  fetchAllSuccess: fetchLoadsSuccess,
  fetchAllFailure: fetchLoadsFailure,
  fetchByIdRequest: fetchLoadDetailsRequest,
  fetchByIdSuccess: fetchLoadDetailsSuccess,
  fetchByIdFailure: fetchLoadDetailsFailure,
  createRequest: createLoadRequest,
  createSuccess: createLoadSuccess,
  createFailure: createLoadFailure,
  updateRequest: updateLoadRequest,
  updateSuccess: updateLoadSuccess,
  updateFailure: updateLoadFailure,
  deleteRequest: deleteLoadRequest,
  deleteSuccess: deleteLoadSuccess,
  deleteFailure: deleteLoadFailure,
} = loadPageSlice.actions;

// ---------------------------------------------------------------------------
// Custom actions for load-specific features
// ---------------------------------------------------------------------------

export const setBoardView = createAction<BoardView>('load/setBoardView');

export const setLoadFilters = createAction<LoadFilters>('load/setLoadFilters');

export const transitionLoadStatusRequest = createAction<{
  loadId: string;
  input: TransitionStatusInput;
}>('load/transitionLoadStatusRequest');

export const transitionLoadStatusSuccess = createAction<{
  loadId: string;
  newStatus: LoadStatus;
}>('load/transitionLoadStatusSuccess');

export const transitionLoadStatusFailure = createAction<{
  loadId: string;
  error: string;
}>('load/transitionLoadStatusFailure');

export const showTransitionWarnings = createAction<{
  loadId: string;
  warnings: { code: string; message: string; detail?: string }[];
}>('load/showTransitionWarnings');

export const createCheckCallRequest = createAction<{
  loadId: string;
  data: {
    location?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
    eta?: string;
    notes?: string;
    brokerNotified: boolean;
    brokerNotes?: string;
  };
}>('load/createCheckCallRequest');

export const createCheckCallSuccess = createAction<{
  loadId: string;
}>('load/createCheckCallSuccess');

export const createCheckCallFailure = createAction<{
  loadId: string;
  error: string;
}>('load/createCheckCallFailure');

// ---------------------------------------------------------------------------
// Stop CRUD actions
// ---------------------------------------------------------------------------

export const createStopRequest = createAction<{
  loadId: string;
  data: {
    type: string;
    sequence?: number;
    facilityName?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    contactName?: string;
    contactPhone?: string;
    notes?: string;
  };
}>('load/createStopRequest');

export const createStopSuccess = createAction<{ loadId: string }>('load/createStopSuccess');
export const createStopFailure = createAction<{ loadId: string; error: string }>(
  'load/createStopFailure',
);

export const updateStopRequest = createAction<{
  loadId: string;
  stopId: string;
  data: Record<string, unknown>;
}>('load/updateStopRequest');

export const updateStopSuccess = createAction<{ loadId: string }>('load/updateStopSuccess');
export const updateStopFailure = createAction<{ loadId: string; error: string }>(
  'load/updateStopFailure',
);

export const deleteStopRequest = createAction<{
  loadId: string;
  stopId: string;
}>('load/deleteStopRequest');

export const deleteStopSuccess = createAction<{ loadId: string }>('load/deleteStopSuccess');
export const deleteStopFailure = createAction<{ loadId: string; error: string }>(
  'load/deleteStopFailure',
);

export const reorderStopsRequest = createAction<{
  loadId: string;
  stopOrder: { id: string; sequence: number }[];
}>('load/reorderStopsRequest');

export const reorderStopsSuccess = createAction<{ loadId: string }>('load/reorderStopsSuccess');
export const reorderStopsFailure = createAction<{ loadId: string; error: string }>(
  'load/reorderStopsFailure',
);

// ---------------------------------------------------------------------------
// Accessorial CRUD actions
// ---------------------------------------------------------------------------

export const createAccessorialRequest = createAction<{
  loadId: string;
  data: { type: string; description?: string; amount: number; billTo?: string };
}>('load/createAccessorialRequest');

export const createAccessorialSuccess = createAction<{ loadId: string }>(
  'load/createAccessorialSuccess',
);
export const createAccessorialFailure = createAction<{ loadId: string; error: string }>(
  'load/createAccessorialFailure',
);

export const updateAccessorialRequest = createAction<{
  loadId: string;
  accessorialId: string;
  data: { type?: string; description?: string; amount?: number; billTo?: string };
}>('load/updateAccessorialRequest');

export const updateAccessorialSuccess = createAction<{ loadId: string }>(
  'load/updateAccessorialSuccess',
);
export const updateAccessorialFailure = createAction<{ loadId: string; error: string }>(
  'load/updateAccessorialFailure',
);

export const deleteAccessorialRequest = createAction<{
  loadId: string;
  accessorialId: string;
}>('load/deleteAccessorialRequest');

export const deleteAccessorialSuccess = createAction<{ loadId: string }>(
  'load/deleteAccessorialSuccess',
);
export const deleteAccessorialFailure = createAction<{ loadId: string; error: string }>(
  'load/deleteAccessorialFailure',
);
