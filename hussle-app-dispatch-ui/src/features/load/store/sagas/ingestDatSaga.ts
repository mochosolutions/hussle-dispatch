import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { ingestLoads } from 'utils/api/loadBoard/loadBoardApi';

import datMockData from '../../data/datMockData.json';
import {
  fetchFeedRequest,
  ingestDatFailure,
  ingestDatSuccess,
} from '../reducers/loadPageSlice';

export function* ingestDatSaga(): Generator {
  try {
    yield call(ingestLoads, 'dat', datMockData as Record<string, unknown>[]);
    yield put(ingestDatSuccess());
    yield put(fetchFeedRequest());
    yield put(notify({ message: 'DAT loads synced successfully', variant: 'success' }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sync DAT loads';
    yield put(ingestDatFailure(message));
    yield put(notify({ message: message, variant: 'error' }));
  }
}
