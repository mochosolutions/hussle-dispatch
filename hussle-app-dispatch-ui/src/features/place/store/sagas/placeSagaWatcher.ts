import { takeLatest } from 'redux-saga/effects';
import { placePageSlice } from '../reducers/placePageSlice';
import { fetchPlacesSaga } from './fetchPlacesSaga';
import { fetchPlaceDetailsSaga } from './fetchPlaceDetailsSaga';
import { createPlaceSaga } from './createPlaceSaga';
import { updatePlaceSaga } from './updatePlaceSaga';
import { deletePlaceSaga } from './deletePlaceSaga';

export const { actions: placePageActions } = placePageSlice;

export function* placeSagaWatcher(): Generator {
  yield takeLatest(placePageActions.fetchAllRequest.type, fetchPlacesSaga);
  yield takeLatest(placePageActions.fetchByIdRequest.type, fetchPlaceDetailsSaga);
  yield takeLatest(placePageActions.createRequest.type, createPlaceSaga);
  yield takeLatest(placePageActions.updateRequest.type, updatePlaceSaga);
  yield takeLatest(placePageActions.deleteRequest.type, deletePlaceSaga);
}
