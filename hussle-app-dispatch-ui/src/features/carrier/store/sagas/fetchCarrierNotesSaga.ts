import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getCarrierNotes } from 'utils/api/fleet/carrierApi';
import {
  fetchCarrierNotesSuccess,
  fetchCarrierNotesFailure,
} from '../reducers/carrierNotesSlice';

export function* fetchCarrierNotesSaga(
  action: PayloadAction<{ carrierId: string }>,
): Generator {
  const { carrierId } = action.payload;

  try {
    const response = (yield call(
      getCarrierNotes,
      carrierId,
    )) as SagaReturnType<typeof getCarrierNotes>;

    yield put(fetchCarrierNotesSuccess({ carrierId, notes: response }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load carrier notes';
    yield put(fetchCarrierNotesFailure({ carrierId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
