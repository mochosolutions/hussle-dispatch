import { all } from 'redux-saga/effects';
import { carrierSagaWatcher } from 'pages/fleet/store/sagas';

export default function* rootSaga() {
  yield all([carrierSagaWatcher()]);
}
