import { all, fork } from 'redux-saga/effects';
import { fetchSessionSaga } from './fetchSessionSaga';
import { autoSaveSaga } from './autoSaveSaga';
import { savePhaseDataSaga } from './savePhaseDataSaga';

export function* portalRootSaga(): Generator {
  yield all([
    fork(fetchSessionSaga),
    fork(autoSaveSaga),
    fork(savePhaseDataSaga),
  ]);
}
