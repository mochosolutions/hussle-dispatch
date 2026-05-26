import { createAction } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors, LoadingState } from '@mocho/ui/redux';
import type { CrudPageState } from '@mocho/ui/redux';
import type { PaginationMeta } from 'features/carrier/types';
import type { SmsPromptScheduleResponse } from 'utils/api/loads/smsPromptApi';
import type {
  AssignLoadInput,
  BoardView,
  FeedMeta,
  LoadBoardSource,
  LoadFilters,
  LoadStatus,
  StagedLoad,
  TransitionStatusInput,
} from '../../types';

// ---------------------------------------------------------------------------
// Extended state — adds boardView and filters to the standard CRUD page state
// ---------------------------------------------------------------------------

export interface CommandCenterLayers {
  showDrivers: boolean;
  showFeedLoads: boolean;
  showActiveLoads: boolean;
}

export interface OnboardingBlockInfo {
  loadId: string;
  carrierId: string;
  carrierName: string;
  missingDocuments: string[];
}

export interface LoadPageState extends CrudPageState {
  boardView: BoardView;
  filters: LoadFilters;
  lastRefreshed: string | null;
  commandCenterLayers: CommandCenterLayers;
  feedLoads: StagedLoad[];
  feedMeta: FeedMeta | null;
  sourceFilter: 'all' | LoadBoardSource;
  feedLoading: boolean;
  feedError: string | null;
  datIngesting: boolean;
  onboardingBlock: OnboardingBlockInfo | null;
}

// ---------------------------------------------------------------------------
// Board view persistence in localStorage — initialised at slice creation so
// the persisted view is part of `initialState` rather than restored via a
// component-level useEffect. Self-documenting: the persisted value flows
// through the same Redux pipeline as any other action-driven state change.
// ---------------------------------------------------------------------------

const BOARD_VIEW_STORAGE_KEY = 'dispatch-board-view';

const isBoardView = (value: string): value is BoardView =>
  value === 'kanban' ||
  value === 'table' ||
  value === 'driver' ||
  value === 'intel' ||
  value === 'map';

const readPersistedBoardView = (): BoardView => {
  try {
    const stored = localStorage.getItem(BOARD_VIEW_STORAGE_KEY);
    if (stored && isBoardView(stored)) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (SSR, private browsing, etc.)
  }
  return 'table';
};

const persistBoardView = (view: BoardView): void => {
  try {
    localStorage.setItem(BOARD_VIEW_STORAGE_KEY, view);
  } catch {
    // localStorage may be unavailable
  }
};

const loadPageInitialExtras: Pick<
  LoadPageState,
  | 'boardView'
  | 'filters'
  | 'lastRefreshed'
  | 'commandCenterLayers'
  | 'feedLoads'
  | 'feedMeta'
  | 'sourceFilter'
  | 'feedLoading'
  | 'feedError'
  | 'datIngesting'
  | 'onboardingBlock'
> = {
  boardView: readPersistedBoardView(),
  filters: {},
  lastRefreshed: null,
  commandCenterLayers: { showDrivers: true, showFeedLoads: true, showActiveLoads: true },
  feedLoads: [],
  feedMeta: null,
  sourceFilter: 'all',
  feedLoading: false,
  feedError: null,
  datIngesting: false,
  onboardingBlock: null,
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

// Loading-map helpers — mirror @mocho/ui/redux setPending/setFulfilled/setRejected,
// but operate on plain state (the wrapper reducer is not Immer-wrapped).
const setLoadPending = (state: LoadPageState, key: string): LoadPageState => ({
  ...state,
  loading: { ...state.loading, [key]: LoadingState.Pending },
});

const setLoadFulfilled = (state: LoadPageState, key: string): LoadPageState => ({
  ...state,
  loading: { ...state.loading, [key]: LoadingState.Fulfilled },
  errors: { ...state.errors, [key]: '' },
});

const setLoadRejected = (
  state: LoadPageState,
  key: string,
  error: string,
): LoadPageState => ({
  ...state,
  loading: { ...state.loading, [key]: LoadingState.Rejected },
  errors: { ...state.errors, [key]: error },
});

// Helper — preserves all custom (non-CRUD) fields when merging CRUD state changes
const preserveCustomFields = (
  crudState: CrudPageState,
  customState: LoadPageState,
): LoadPageState => ({
  ...crudState,
  boardView: customState.boardView,
  filters: customState.filters,
  lastRefreshed: customState.lastRefreshed,
  commandCenterLayers: customState.commandCenterLayers,
  feedLoads: customState.feedLoads,
  feedMeta: customState.feedMeta,
  sourceFilter: customState.sourceFilter,
  feedLoading: customState.feedLoading,
  feedError: customState.feedError,
  datIngesting: customState.datIngesting,
  onboardingBlock: customState.onboardingBlock,
});

export const loadPageReducer = (
  state: LoadPageState = initialState,
  action: UnknownAction,
): LoadPageState => {
  // Handle custom actions first
  if (setBoardView.match(action)) {
    persistBoardView(action.payload);
    return { ...state, boardView: action.payload };
  }

  if (setLoadFilters.match(action)) {
    return { ...state, filters: action.payload };
  }

  if (toggleCommandCenterLayer.match(action)) {
    return {
      ...state,
      commandCenterLayers: {
        ...state.commandCenterLayers,
        [action.payload]: !state.commandCenterLayers[action.payload],
      },
    };
  }

  if (fetchLoadsSuccess.match(action)) {
    const nextCrud = crudReducer(state, action);
    return { ...preserveCustomFields(nextCrud, state), lastRefreshed: new Date().toISOString() };
  }

  // ---------------------------------------------------------------------------
  // Load board feed actions
  // ---------------------------------------------------------------------------

  if (fetchFeedRequest.match(action)) {
    return { ...state, feedLoading: true };
  }
  if (fetchFeedSuccess.match(action)) {
    return {
      ...state,
      feedLoading: false,
      feedLoads: action.payload.loads,
      feedMeta: action.payload.meta,
    };
  }
  if (fetchFeedFailure.match(action)) {
    return { ...state, feedLoading: false, feedError: action.payload };
  }
  if (setSourceFilter.match(action)) {
    return { ...state, sourceFilter: action.payload };
  }
  if (ingestDatRequest.match(action)) {
    return { ...state, datIngesting: true };
  }
  if (ingestDatSuccess.match(action)) {
    return { ...state, datIngesting: false };
  }
  if (ingestDatFailure.match(action)) {
    return { ...state, datIngesting: false, feedError: action.payload };
  }

  // Status transition lifecycle — composite-key loading state per load
  if (transitionLoadStatusRequest.match(action)) {
    return setLoadPending(state, `transition:${action.payload.loadId}`);
  }
  if (transitionLoadStatusSuccess.match(action)) {
    return setLoadFulfilled(state, `transition:${action.payload.loadId}`);
  }
  if (transitionLoadStatusFailure.match(action)) {
    return setLoadRejected(state, `transition:${action.payload.loadId}`, action.payload.error);
  }

  // Onboarding block actions
  if (setOnboardingBlock.match(action)) {
    return { ...state, onboardingBlock: action.payload };
  }
  if (clearOnboardingBlock.match(action)) {
    return { ...state, onboardingBlock: null };
  }

  // Assign-and-dispatch lifecycle — composite-key loading state per load
  if (assignAndDispatchRequest.match(action)) {
    return setLoadPending(state, `assignAndDispatch:${action.payload.loadId}`);
  }
  if (assignAndDispatchSuccess.match(action)) {
    return setLoadFulfilled(state, `assignAndDispatch:${action.payload.loadId}`);
  }
  if (assignAndDispatchFailure.match(action)) {
    return setLoadRejected(state, `assignAndDispatch:${action.payload.loadId}`, action.payload.error);
  }

  // Delegate all other actions to the CRUD slice reducer
  const nextCrudState = crudReducer(state, action);

  // If the CRUD reducer returned the same reference, no change — return current state
  if (nextCrudState === state) {
    return state;
  }

  // Merge CRUD state changes while preserving custom fields
  return preserveCustomFields(nextCrudState, state);
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

export const toggleCommandCenterLayer = createAction<keyof CommandCenterLayers>(
  'load/toggleCommandCenterLayer',
);

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

// ---------------------------------------------------------------------------
// Assignment actions
// ---------------------------------------------------------------------------

export const assignLoadRequest = createAction<{
  loadId: string;
  data: AssignLoadInput;
}>('load/assignLoadRequest');

export const assignLoadSuccess = createAction<{
  loadId: string;
}>('load/assignLoadSuccess');

export const assignLoadFailure = createAction<{
  loadId: string;
  error: string;
}>('load/assignLoadFailure');

export const assignAndDispatchRequest = createAction<{
  loadId: string;
  assignment: AssignLoadInput;
  notes?: string;
}>('load/assignAndDispatchRequest');

export const assignAndDispatchSuccess = createAction<{
  loadId: string;
}>('load/assignAndDispatchSuccess');

export const assignAndDispatchFailure = createAction<{
  loadId: string;
  error: string;
}>('load/assignAndDispatchFailure');

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
// Dispatch terms (per-load) — US-12
// ---------------------------------------------------------------------------

export interface UpdateDispatchTermsActionPayload {
  loadId: string;
  data: import('utils/api/loads/loadApi').UpdateDispatchTermsInput;
}

export const updateDispatchTermsRequest = createAction<UpdateDispatchTermsActionPayload>(
  'load/updateDispatchTermsRequest',
);

export const updateDispatchTermsSuccess = createAction<{ loadId: string }>(
  'load/updateDispatchTermsSuccess',
);

export const updateDispatchTermsFailure = createAction<{ loadId: string; error: string }>(
  'load/updateDispatchTermsFailure',
);

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
    appointmentStart?: string;
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

// ---------------------------------------------------------------------------
// Load board feed actions (migrated from loadBoard feature)
// ---------------------------------------------------------------------------

export const fetchFeedRequest = createAction('load/fetchFeedRequest');

export const fetchFeedSuccess = createAction<{ loads: StagedLoad[]; meta: FeedMeta }>(
  'load/fetchFeedSuccess',
);

export const fetchFeedFailure = createAction<string>('load/fetchFeedFailure');

export const setSourceFilter = createAction<'all' | LoadBoardSource>('load/setSourceFilter');

export const ingestDatRequest = createAction('load/ingestDatRequest');

export const ingestDatSuccess = createAction('load/ingestDatSuccess');

export const ingestDatFailure = createAction<string>('load/ingestDatFailure');

export const setOnboardingBlock = createAction<OnboardingBlockInfo>('load/setOnboardingBlock');

export const clearOnboardingBlock = createAction('load/clearOnboardingBlock');

export const startPolling = createAction('load/startPolling');

export const stopPolling = createAction('load/stopPolling');

// ---------------------------------------------------------------------------
// SMS prompt actions
// ---------------------------------------------------------------------------

export const sendSmsPromptRequest = createAction<{ loadId: string }>('load/sendSmsPromptRequest');

export const sendSmsPromptSuccess = createAction<{
  loadId: string;
  prompt: SmsPromptScheduleResponse;
}>('load/sendSmsPromptSuccess');

export const sendSmsPromptFailure = createAction<{ loadId: string; error: string }>(
  'load/sendSmsPromptFailure',
);

export const fetchSmsPromptHistoryRequest = createAction<{
  loadId: string;
  page?: number;
  limit?: number;
}>('load/fetchSmsPromptHistoryRequest');

export const fetchSmsPromptHistorySuccess = createAction<{
  loadId: string;
  data: SmsPromptScheduleResponse[];
  meta: PaginationMeta;
}>('load/fetchSmsPromptHistorySuccess');

export const fetchSmsPromptHistoryFailure = createAction<{ loadId: string; error: string }>(
  'load/fetchSmsPromptHistoryFailure',
);

// Polling actions — saga wiring is US-06's responsibility.
export const startSmsPromptPolling = createAction<{ loadId: string }>(
  'load/startSmsPromptPolling',
);

export const stopSmsPromptPolling = createAction('load/stopSmsPromptPolling');
