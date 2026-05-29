import { createAction } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import { createCrudSlice, createCrudSelectors, LoadingState } from '@mocho/ui/redux';
import type { CrudPageState } from '@mocho/ui/redux';
import type { RootState } from 'store';
import type {
  RateconImport,
  RateconImportSource,
  RateconImportStatus,
} from 'utils/api/ratecon-imports';

// ---------------------------------------------------------------------------
// Extended state — adds inbox filters + manual-upload flag to the CRUD base.
// ---------------------------------------------------------------------------

export interface RateconImportFilters {
  status?: RateconImportStatus;
  source?: RateconImportSource;
  search?: string;
}

export interface RateconImportPageState extends CrudPageState {
  filters: RateconImportFilters;
  manualUploading: boolean;
}

const pageInitialExtras: Pick<RateconImportPageState, 'filters' | 'manualUploading'> = {
  filters: {},
  manualUploading: false,
};

export const rateconImportPageSlice = createCrudSlice({
  name: 'rateconImport',
  entityName: 'ratecon import',
  entityNamePlural: 'ratecon imports',
  operations: ['getAll', 'getById'],
});

export const rateconImportPageSelectors = createCrudSelectors<RootState>(
  (state) => state.pages.rateconImports,
);

const crudReducer = rateconImportPageSlice.reducer;

const initialState: RateconImportPageState = {
  ...crudReducer(undefined, { type: '@@INIT' }),
  ...pageInitialExtras,
};

// Loading-map helpers — operate on plain state (the wrapper is not Immer-wrapped).
const setPending = (
  state: RateconImportPageState,
  key: string,
): RateconImportPageState => ({
  ...state,
  loading: { ...state.loading, [key]: LoadingState.Pending },
});

const setFulfilled = (
  state: RateconImportPageState,
  key: string,
): RateconImportPageState => ({
  ...state,
  loading: { ...state.loading, [key]: LoadingState.Fulfilled },
  errors: { ...state.errors, [key]: '' },
});

const setRejected = (
  state: RateconImportPageState,
  key: string,
  error: string,
): RateconImportPageState => ({
  ...state,
  loading: { ...state.loading, [key]: LoadingState.Rejected },
  errors: { ...state.errors, [key]: error },
});

const preserveCustomFields = (
  crudState: CrudPageState,
  customState: RateconImportPageState,
): RateconImportPageState => ({
  ...crudState,
  filters: customState.filters,
  manualUploading: customState.manualUploading,
});

export const rateconImportPageReducer = (
  state: RateconImportPageState = initialState,
  action: UnknownAction,
): RateconImportPageState => {
  if (setRateconFilters.match(action)) {
    return { ...state, filters: action.payload };
  }

  if (acceptImportRequest.match(action)) {
    return setPending(state, `accept:${action.payload.importId}`);
  }
  if (acceptImportSuccess.match(action)) {
    return setFulfilled(state, `accept:${action.payload.importId}`);
  }
  if (acceptImportFailure.match(action)) {
    return setRejected(state, `accept:${action.payload.importId}`, action.payload.error);
  }

  if (rejectImportRequest.match(action)) {
    return setPending(state, `reject:${action.payload.importId}`);
  }
  if (rejectImportSuccess.match(action)) {
    return setFulfilled(state, `reject:${action.payload.importId}`);
  }
  if (rejectImportFailure.match(action)) {
    return setRejected(state, `reject:${action.payload.importId}`, action.payload.error);
  }

  if (retryImportRequest.match(action)) {
    return setPending(state, `retry:${action.payload.importId}`);
  }
  if (retryImportSuccess.match(action)) {
    return setFulfilled(state, `retry:${action.payload.importId}`);
  }
  if (retryImportFailure.match(action)) {
    return setRejected(state, `retry:${action.payload.importId}`, action.payload.error);
  }

  if (reviewImportRequest.match(action)) {
    return setPending(state, `review:${action.payload.importId}`);
  }
  if (reviewImportSuccess.match(action)) {
    return setFulfilled(state, `review:${action.payload.importId}`);
  }
  if (reviewImportFailure.match(action)) {
    return setRejected(state, `review:${action.payload.importId}`, action.payload.error);
  }

  if (manualUploadRequest.match(action)) {
    return { ...setPending(state, 'manualUpload'), manualUploading: true };
  }
  if (manualUploadSuccess.match(action)) {
    return { ...setFulfilled(state, 'manualUpload'), manualUploading: false };
  }
  if (manualUploadFailure.match(action)) {
    return { ...setRejected(state, 'manualUpload', action.payload.error), manualUploading: false };
  }

  const nextCrudState = crudReducer(state, action);
  if (nextCrudState === state) {
    return state;
  }
  return preserveCustomFields(nextCrudState, state);
};

// Semantic action aliases
export const {
  fetchAllRequest: fetchImportsRequest,
  fetchAllSuccess: fetchImportsSuccess,
  fetchAllFailure: fetchImportsFailure,
  fetchByIdRequest: fetchImportDetailRequest,
  fetchByIdSuccess: fetchImportDetailSuccess,
  fetchByIdFailure: fetchImportDetailFailure,
} = rateconImportPageSlice.actions;

// ---------------------------------------------------------------------------
// Custom actions
// ---------------------------------------------------------------------------

export const setRateconFilters = createAction<RateconImportFilters>(
  'rateconImport/setFilters',
);

export const acceptImportRequest = createAction<{ importId: string; loadId: string }>(
  'rateconImport/acceptRequest',
);
export const acceptImportSuccess = createAction<{ importId: string }>(
  'rateconImport/acceptSuccess',
);
export const acceptImportFailure = createAction<{ importId: string; error: string }>(
  'rateconImport/acceptFailure',
);

export const rejectImportRequest = createAction<{ importId: string }>(
  'rateconImport/rejectRequest',
);
export const rejectImportSuccess = createAction<{ importId: string }>(
  'rateconImport/rejectSuccess',
);
export const rejectImportFailure = createAction<{ importId: string; error: string }>(
  'rateconImport/rejectFailure',
);

export const retryImportRequest = createAction<{ importId: string }>(
  'rateconImport/retryRequest',
);
export const retryImportSuccess = createAction<{ importId: string; import: RateconImport }>(
  'rateconImport/retrySuccess',
);
export const retryImportFailure = createAction<{ importId: string; error: string }>(
  'rateconImport/retryFailure',
);

export const reviewImportRequest = createAction<{ importId: string }>(
  'rateconImport/reviewRequest',
);
export const reviewImportSuccess = createAction<{ importId: string }>(
  'rateconImport/reviewSuccess',
);
export const reviewImportFailure = createAction<{ importId: string; error: string }>(
  'rateconImport/reviewFailure',
);

export const manualUploadRequest = createAction<{ file: File }>(
  'rateconImport/manualUploadRequest',
);
export const manualUploadSuccess = createAction<{ import: RateconImport }>(
  'rateconImport/manualUploadSuccess',
);
export const manualUploadFailure = createAction<{ error: string }>(
  'rateconImport/manualUploadFailure',
);

export const startRateconPolling = createAction('rateconImport/startPolling');
export const stopRateconPolling = createAction('rateconImport/stopPolling');
