import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { createContact } from 'utils/api/fleet/contactApi';
import type { CreateContactInput } from '../../types';
import {
  createContactSuccess,
  createContactFailure,
  fetchContactsRequest,
} from '../reducers/contactPageSlice';
import { contactActions } from '../reducers/contactEntitySlice';

export function* createContactSaga(
  action: PayloadAction<{ data: CreateContactInput }>,
): Generator {
  try {
    const { data } = action.payload;

    const response = (yield call(
      createContact,
      data,
    )) as SagaReturnType<typeof createContact>;

    yield put(contactActions.addOne(response));
    yield put(createContactSuccess({}));

    yield call(enqueueSnackbar, 'Contact created', { variant: 'success' });

    // Refetch list to ensure consistent state
    yield put(fetchContactsRequest({ page: 1, limit: 25 }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create contact';
    yield put(createContactFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
