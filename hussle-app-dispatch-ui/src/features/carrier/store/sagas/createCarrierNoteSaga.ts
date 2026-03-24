import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { createCarrierNote } from 'utils/api/fleet/carrierApi';
import type { CreateCarrierNoteInput } from '../../types';
import {
  createCarrierNoteSuccess,
  createCarrierNoteFailure,
} from '../reducers/carrierNotesSlice';

export function* createCarrierNoteSaga(
  action: PayloadAction<{ carrierId: string; data: CreateCarrierNoteInput }>,
): Generator {
  const { carrierId, data } = action.payload;

  try {
    const response = (yield call(
      createCarrierNote,
      carrierId,
      data,
    )) as SagaReturnType<typeof createCarrierNote>;

    yield put(createCarrierNoteSuccess({ carrierId, note: response }));
    yield call(enqueueSnackbar, 'Note added', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add note';
    yield put(createCarrierNoteFailure({ carrierId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
