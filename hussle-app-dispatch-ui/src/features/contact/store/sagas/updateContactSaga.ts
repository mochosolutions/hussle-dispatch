import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { updateContact } from 'utils/api/fleet/contactApi';
import type { UpdateContactInput } from '../../types';
import {
  updateContactSuccess,
  updateContactFailure,
} from '../reducers/contactPageSlice';
import { contactActions } from '../reducers/contactEntitySlice';

export function* updateContactSaga(
  action: PayloadAction<{ id: string; data: UpdateContactInput }>,
): Generator {
  try {
    const { id, data } = action.payload;

    const response = (yield call(
      updateContact,
      id,
      data,
    )) as SagaReturnType<typeof updateContact>;

    yield put(contactActions.updateOne({ id, changes: response }));
    yield put(updateContactSuccess({ id }));

    yield call(enqueueSnackbar, 'Contact updated', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update contact';
    yield put(updateContactFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
