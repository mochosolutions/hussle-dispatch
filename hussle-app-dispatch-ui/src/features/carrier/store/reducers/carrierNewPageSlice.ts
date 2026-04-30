import { createAction } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';
import type { CrudPageState } from '@mocho/ui/redux';
import type { CarrierStats } from 'utils/api/fleet/carrierApi';

// ---------------------------------------------------------------------------
// Extended state — adds stats to the standard CRUD page state
// ---------------------------------------------------------------------------

export interface CarrierPageState extends CrudPageState {
  stats: CarrierStats | null;
  statsLoading: boolean;
}

const carrierPageInitialExtras: Pick<CarrierPageState, 'stats' | 'statsLoading'> = {
  stats: null,
  statsLoading: false,
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

  const nextCrudState = crudReducer(state, action);

  if (nextCrudState === state) {
    return state;
  }

  return {
    ...nextCrudState,
    stats: state.stats,
    statsLoading: state.statsLoading,
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
