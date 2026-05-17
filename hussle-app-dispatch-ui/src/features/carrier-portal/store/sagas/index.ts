// Carrier Portal V2 — root saga (one operation per file).

import { all, fork } from 'redux-saga/effects';

import { fetchAgreementSaga } from './fetchAgreementSaga';
import { loadSessionSaga } from './loadSessionSaga';
import { saveAndExitSaga } from './saveAndExitSaga';
import { saveCostAnalysisSaga } from './saveCostAnalysisSaga';
import { saveLanePreferencesSaga } from './saveLanePreferencesSaga';
import { submitStepSaga } from './submitStepSaga';
import { uploadDocumentSaga } from './uploadDocumentSaga';

export function* carrierPortalV2RootSaga(): Generator {
  yield all([
    fork(loadSessionSaga),
    fork(submitStepSaga),
    fork(fetchAgreementSaga),
    fork(uploadDocumentSaga),
    fork(saveCostAnalysisSaga),
    fork(saveLanePreferencesSaga),
    fork(saveAndExitSaga),
  ]);
}
