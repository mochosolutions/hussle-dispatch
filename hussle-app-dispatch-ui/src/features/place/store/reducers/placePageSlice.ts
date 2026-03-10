import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';

export const placePageSlice = createCrudSlice({
  name: 'place',
  entityName: 'place',
  entityNamePlural: 'places',
});

export const placePageSelectors = createCrudSelectors<RootState>(
  (state) => state.pages.places,
);

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
