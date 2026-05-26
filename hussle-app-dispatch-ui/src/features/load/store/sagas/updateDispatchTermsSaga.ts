import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { updateDispatchTerms } from 'utils/api/loads/loadApi';
import {
  updateDispatchTermsSuccess,
  updateDispatchTermsFailure,
  type UpdateDispatchTermsActionPayload,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

export function* updateDispatchTermsSaga(
  action: PayloadAction<UpdateDispatchTermsActionPayload>,
): Generator {
  const { loadId, data } = action.payload;
  try {
    const load = (yield call(updateDispatchTerms, loadId, data)) as SagaReturnType<
      typeof updateDispatchTerms
    >;

    yield put(loadActions.upsertOne(load));
    yield put(updateDispatchTermsSuccess({ loadId }));
    yield put(notify({ message: 'Dispatch terms updated', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update dispatch terms';
    yield put(updateDispatchTermsFailure({ loadId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
