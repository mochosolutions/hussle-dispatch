import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getContacts } from 'utils/api/fleet/contactApi';
import {
  fetchContactsSuccess,
  fetchContactsFailure,
} from '../reducers/contactPageSlice';
import { contactActions } from '../reducers/contactEntitySlice';

interface FetchContactsPayload {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}

export function* fetchContactsSaga(action: PayloadAction<FetchContactsPayload>): Generator {
  try {
    const response = (yield call(
      getContacts,
      action.payload,
    )) as SagaReturnType<typeof getContacts>;

    yield put(contactActions.setAll(response.data));
    yield put(
      fetchContactsSuccess({
        total: response.meta.total,
        page: response.meta.page,
        limit: response.meta.limit,
      }),
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load contacts';
    yield put(fetchContactsFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
