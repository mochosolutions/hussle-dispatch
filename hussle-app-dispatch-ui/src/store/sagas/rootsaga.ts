import { all } from 'redux-saga/effects';
import { carrierSagaWatcher } from 'features/carrier/store/sagas/carrierSagasWatcher';
import { vehicleSagaWatcher } from 'features/vehicle/store/sagas/vehicleSagasWatcher';
import { driverSagaWatcher } from 'features/driver/store/sagas/driverSagasWatcher';
import { authWatcher } from 'features/auth/store';

export default function* rootSaga() {
  yield all([authWatcher(), carrierSagaWatcher(), vehicleSagaWatcher(), driverSagaWatcher()]);
}
