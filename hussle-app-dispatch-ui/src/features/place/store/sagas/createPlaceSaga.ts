import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { createPlace } from 'utils/api/places/placeApi';
import type { CreatePlaceInput } from '../../types';
import {
  createPlaceSuccess,
  createPlaceFailure,
  fetchPlacesRequest,
} from '../reducers/placePageSlice';
import { placeActions } from '../reducers/placeEntitySlice';

export function* createPlaceSaga(
  action: PayloadAction<{ data: CreatePlaceInput }>,
): Generator {
  try {
    const { data } = action.payload;

    const response = (yield call(
      createPlace,
      data,
    )) as SagaReturnType<typeof createPlace>;

    yield put(placeActions.addOne(response.place));
    yield put(createPlaceSuccess({}));

    yield call(enqueueSnackbar, 'Place created', { variant: 'success' });

    // Refetch list to ensure consistent state
    yield put(fetchPlacesRequest({ page: 1, limit: 25 }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create place';
    yield put(createPlaceFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
