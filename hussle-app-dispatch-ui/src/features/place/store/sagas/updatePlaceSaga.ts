import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
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

    yield put(placeActions.updateOne({ id, changes: response }));
    yield put(placeActions.upsertOne(response));
    yield put(updatePlaceSuccess({ id }));

    yield put(notify({ message: 'Place updated', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update place';
    yield put(updatePlaceFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
