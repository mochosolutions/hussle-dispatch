import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { isAxiosError } from 'axios';
import { updateLoad } from 'utils/api/loads/loadApi';
import type { UpdateLoadInput } from '../../types';
import {
  updateLoadSuccess,
  updateLoadFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';
import type { UpdateRequestPayload } from '../../../../mocho/redux/createCrudSlice';

export function* updateLoadSaga(
  action: PayloadAction<UpdateRequestPayload<UpdateLoadInput>>,
): Generator {
  try {
    const { id, data } = action.payload;

    const response = (yield call(updateLoad, id, data)) as SagaReturnType<typeof updateLoad>;
    const { data: load, warnings } = response;

    yield put(loadActions.upsertOne(load));
    yield put(updateLoadSuccess({ id }));

    yield put(notify({ message: 'Load updated', variant: 'success' }));

    // Surface non-blocking geocoding warnings
    for (const warning of warnings) {
      yield put(notify({ message: warning.message, variant: 'warning' }));
    }
  } catch (error: unknown) {
    // Parse structured blocker errors from assignment validation (422)
    if (isAxiosError(error) && error.response?.status === 422) {
      const blockers = error.response.data?.blockers;
      if (Array.isArray(blockers) && blockers.length > 0) {
        const blockerMessages = blockers
          .map((b: { message: string }) => b.message)
          .join('\n');
        yield put(updateLoadFailure({ error: blockerMessages }));
        yield put(notify({ message: blockerMessages, variant: 'error' }));
        return;
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to update load';
    yield put(updateLoadFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
