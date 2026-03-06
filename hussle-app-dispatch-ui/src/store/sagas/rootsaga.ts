import { all } from 'redux-saga/effects';
import { carrierSagaWatcher } from 'features/carrier/store/sagas/carrierSagasWatcher';
import { authWatcher } from 'features/auth/store';

export default function* rootSaga() {
  yield all([authWatcher(), carrierSagaWatcher()]);
}
