import { createAction } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';
import type { CrudPageState } from '@mocho/ui/redux';
import type { CarrierStats } from 'utils/api/fleet/carrierApi';

export interface CarrierTabCounts {
  all: number;
  onboarding: number;
  active: number;
  actionRequired: number;
  suspended: number;
  rejected: number;
}

// ---------------------------------------------------------------------------
// Extended state — adds stats to the standard CRUD page state
// ---------------------------------------------------------------------------

export interface CarrierPageState extends CrudPageState {
  stats: CarrierStats | null;
  statsLoading: boolean;
  tabCounts: CarrierTabCounts;
  tabCountsLoading: boolean;
}

const EMPTY_TAB_COUNTS: CarrierTabCounts = {
  all: 0,
  onboarding: 0,
  active: 0,
  actionRequired: 0,
  suspended: 0,
  rejected: 0,
};

const carrierPageInitialExtras: Pick<
  CarrierPageState,
  'stats' | 'statsLoading' | 'tabCounts' | 'tabCountsLoading'
> = {
  stats: null,
  statsLoading: false,
  tabCounts: EMPTY_TAB_COUNTS,
  tabCountsLoading: false,
};

export const carrierPageSlice = createCrudSlice({
  name: 'carrier',
  entityName: 'carrier',
  entityNamePlural: 'carriers',
});

export const carrierPageSelectors = createCrudSelectors<RootState>((state) => state.pages.carriers);

// ---------------------------------------------------------------------------
// Wrapper reducer — delegates to crudSlice, then handles custom actions
// ---------------------------------------------------------------------------

const crudReducer = carrierPageSlice.reducer;

const initialState: CarrierPageState = {
  ...crudReducer(undefined, { type: '@@INIT' }),
  ...carrierPageInitialExtras,
};

export const carrierPageReducer = (
  state: CarrierPageState = initialState,
  action: UnknownAction,
): CarrierPageState => {
  if (fetchCarrierStatsRequest.match(action)) {
    return { ...state, statsLoading: true };
  }

  if (fetchCarrierStatsSuccess.match(action)) {
    return { ...state, stats: action.payload, statsLoading: false };
  }

  if (fetchCarrierStatsFailure.match(action)) {
    return { ...state, stats: null, statsLoading: false };
  }

  if (fetchCarrierTabCountsRequest.match(action)) {
    return { ...state, tabCountsLoading: true };
  }
  if (fetchCarrierTabCountsSuccess.match(action)) {
    return { ...state, tabCounts: action.payload, tabCountsLoading: false };
  }
  if (fetchCarrierTabCountsFailure.match(action)) {
    return { ...state, tabCountsLoading: false };
  }

  const nextCrudState = crudReducer(state, action);

  if (nextCrudState === state) {
    return state;
  }

  return {
    ...nextCrudState,
    stats: state.stats,
    statsLoading: state.statsLoading,
    tabCounts: state.tabCounts,
    tabCountsLoading: state.tabCountsLoading,
  };
};

// Semantic action aliases — match the naming convention used by sagas and barrel exports
export const {
  fetchAllRequest: fetchCarriersRequest,
  fetchAllSuccess: fetchCarriersSuccess,
  fetchAllFailure: fetchCarriersFailure,
  fetchByIdRequest: fetchCarrierDetailsRequest,
  fetchByIdSuccess: fetchCarrierDetailsSuccess,
  fetchByIdFailure: fetchCarrierDetailsFailure,
  createRequest: createCarrierRequest,
  createSuccess: createCarrierSuccess,
  createFailure: createCarrierFailure,
  updateRequest: updateCarrierRequest,
  updateSuccess: updateCarrierSuccess,
  updateFailure: updateCarrierFailure,
  deleteRequest: deleteCarrierRequest,
  deleteSuccess: deleteCarrierSuccess,
  deleteFailure: deleteCarrierFailure,
} = carrierPageSlice.actions;

// ---------------------------------------------------------------------------
// Stats actions
// ---------------------------------------------------------------------------

export const fetchCarrierStatsRequest = createAction<{ id: string }>(
  'carrier/fetchCarrierStatsRequest',
);

export const fetchCarrierStatsSuccess = createAction<CarrierStats>(
  'carrier/fetchCarrierStatsSuccess',
);

export const fetchCarrierStatsFailure = createAction<string>('carrier/fetchCarrierStatsFailure');

// ---------------------------------------------------------------------------
// Tab counts actions
// ---------------------------------------------------------------------------

export const fetchCarrierTabCountsRequest = createAction(
  'carrier/fetchCarrierTabCountsRequest',
);

export const fetchCarrierTabCountsSuccess = createAction<CarrierTabCounts>(
  'carrier/fetchCarrierTabCountsSuccess',
);

export const fetchCarrierTabCountsFailure = createAction<string>(
  'carrier/fetchCarrierTabCountsFailure',
);

// ---------------------------------------------------------------------------
// Admin activate actions
// ---------------------------------------------------------------------------

export const adminActivateCarrierRequest = createAction<{
  id: string;
  reason: string;
  evidenceDocumentId?: string;
}>('carrier/adminActivateRequest');

export const adminActivateCarrierSuccess = createAction<{ id: string; status: string }>(
  'carrier/adminActivateSuccess',
);

export const adminActivateCarrierFailure = createAction<string>('carrier/adminActivateFailure');
