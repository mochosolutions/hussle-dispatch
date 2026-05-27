// Carrier Portal V2 — root saga (one operation per file).

import { all, fork } from 'redux-saga/effects';

import { completeSessionSaga } from './completeSessionSaga';
import { fetchAgreementsSaga } from './fetchAgreementsSaga';
import { loadSessionSaga } from './loadSessionSaga';
import { markAgreementSignedMockSaga } from './markAgreementSignedMockSaga';
import { saveAndExitSaga } from './saveAndExitSaga';
import { saveCompanySaga } from './saveCompanySaga';
import { saveCostAnalysisSaga } from './saveCostAnalysisSaga';
import { saveDriversSaga } from './saveDriversSaga';
import { saveEquipmentSaga } from './saveEquipmentSaga';
import { saveLanePreferencesSaga } from './saveLanePreferencesSaga';
import { submitStepSaga } from './submitStepSaga';
import { uploadDocumentSaga } from './uploadDocumentSaga';

export function* carrierPortalV2RootSaga(): Generator {
  yield all([
    fork(loadSessionSaga),
    fork(submitStepSaga),
    fork(fetchAgreementsSaga),
    fork(markAgreementSignedMockSaga),
    fork(uploadDocumentSaga),
    fork(saveCompanySaga),
    fork(saveEquipmentSaga),
    fork(saveDriversSaga),
    fork(saveCostAnalysisSaga),
    fork(saveLanePreferencesSaga),
    fork(saveAndExitSaga),
    fork(completeSessionSaga),
  ]);
}
