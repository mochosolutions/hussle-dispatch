import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { updatePlace } from 'utils/api/places/placeApi';
import type { UpdatePlaceInput } from '../../types';
import {
  updatePlaceSuccess,
  updatePlaceFailure,
} from '../reducers/placePageSlice';
import { placeActions } from '../reducers/placeEntitySlice';

export function* updatePlaceSaga(
  action: PayloadAction<{ id: string; data: UpdatePlaceInput }>,
): Generator {
  try {
    const { id, data } = action.payload;

    const response = (yield call(
      updatePlace,
      id,
      data,
    )) as SagaReturnType<typeof updatePlace>;

    yield put(placeActions.updateOne({ id, changes: response.place }));
    yield put(updatePlaceSuccess({ id }));

    yield call(enqueueSnackbar, 'Place updated', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update place';
    yield put(updatePlaceFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
