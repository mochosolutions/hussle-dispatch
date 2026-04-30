import { createAction } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';
import type { CrudPageState } from '@mocho/ui/redux';
import type { PlaceStats } from 'utils/api/places/placeApi';

// ---------------------------------------------------------------------------
// Extended state — adds stats to the standard CRUD page state
// ---------------------------------------------------------------------------

export interface PlacePageState extends CrudPageState {
  stats: PlaceStats | null;
  statsLoading: boolean;
}

const placePageInitialExtras: Pick<PlacePageState, 'stats' | 'statsLoading'> = {
  stats: null,
  statsLoading: false,
};

export const placePageSlice = createCrudSlice({
  name: 'place',
  entityName: 'place',
  entityNamePlural: 'places',
});

export const placePageSelectors = createCrudSelectors<RootState>(
  (state) => state.pages.places,
);

// ---------------------------------------------------------------------------
// Wrapper reducer — delegates to crudSlice, then handles custom actions
// ---------------------------------------------------------------------------

const crudReducer = placePageSlice.reducer;

const initialState: PlacePageState = {
  ...crudReducer(undefined, { type: '@@INIT' }),
  ...placePageInitialExtras,
};

export const placePageReducer = (
  state: PlacePageState = initialState,
  action: UnknownAction,
): PlacePageState => {
  if (fetchPlaceStatsRequest.match(action)) {
    return { ...state, statsLoading: true };
  }

  if (fetchPlaceStatsSuccess.match(action)) {
    return { ...state, stats: action.payload, statsLoading: false };
  }

  if (fetchPlaceStatsFailure.match(action)) {
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
  fetchAllRequest: fetchPlacesRequest,
  fetchAllSuccess: fetchPlacesSuccess,
  fetchAllFailure: fetchPlacesFailure,
  fetchByIdRequest: fetchPlaceDetailsRequest,
  fetchByIdSuccess: fetchPlaceDetailsSuccess,
  fetchByIdFailure: fetchPlaceDetailsFailure,
  createRequest: createPlaceRequest,
  createSuccess: createPlaceSuccess,
  createFailure: createPlaceFailure,
  updateRequest: updatePlaceRequest,
  updateSuccess: updatePlaceSuccess,
  updateFailure: updatePlaceFailure,
  deleteRequest: deletePlaceRequest,
  deleteSuccess: deletePlaceSuccess,
  deleteFailure: deletePlaceFailure,
} = placePageSlice.actions;

// ---------------------------------------------------------------------------
// Stats actions
// ---------------------------------------------------------------------------

export const fetchPlaceStatsRequest = createAction<{ id: string }>(
  'place/fetchPlaceStatsRequest',
);

export const fetchPlaceStatsSuccess = createAction<PlaceStats>('place/fetchPlaceStatsSuccess');

export const fetchPlaceStatsFailure = createAction<string>('place/fetchPlaceStatsFailure');
