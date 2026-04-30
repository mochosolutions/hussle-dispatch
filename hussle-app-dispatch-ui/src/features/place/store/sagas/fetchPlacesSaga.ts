import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getPlaces } from 'utils/api/places/placeApi';
import {
  fetchPlacesSuccess,
  fetchPlacesFailure,
} from '../reducers/placePageSlice';
import { placeActions } from '../reducers/placeEntitySlice';

interface FetchPlacesPayload {
  page?: number;
  limit?: number;
  search?: string;
  facilityType?: string;
}

export function* fetchPlacesSaga(action: PayloadAction<FetchPlacesPayload>): Generator {
  try {
    const response = (yield call(
      getPlaces,
      action.payload,
    )) as SagaReturnType<typeof getPlaces>;

    yield put(placeActions.setAll(response.data));
    yield put(
      fetchPlacesSuccess({
        total: response.meta.total,
        page: response.meta.page,
        limit: response.meta.limit,
      }),
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load places';
    yield put(fetchPlacesFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
