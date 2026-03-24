import { all } from 'redux-saga/effects';
import { carrierSagaWatcher } from 'features/carrier/store/sagas/carrierSagasWatcher';
import { vehicleSagaWatcher } from 'features/vehicle/store/sagas/vehicleSagasWatcher';
import { driverSagaWatcher } from 'features/driver/store/sagas/driverSagasWatcher';
import { placeSagaWatcher } from 'features/place/store/sagas/placeSagaWatcher';
import { loadSagaWatcher } from 'features/load/store/sagas/loadSagaWatcher';
import { intelSagaWatcher } from 'features/loadintelligence/store/sagas/intelSagaWatcher';
import { invoiceSagaWatcher } from 'features/invoices/store/sagas/invoiceSagaWatcher';
import { dashboardSagaWatcher } from 'features/dashboard/store/sagas/dashboardSagaWatcher';
import { contactSagaWatcher } from 'features/contact/store/sagas/contactSagasWatcher';
import { customerSagaWatcher } from 'features/customer/store/sagas/customerSagaWatcher';
import { authWatcher } from 'features/auth/store';
import { settingsSagaWatcher } from 'features/settings/store/sagas/settingsSagaWatcher';

export default function* rootSaga() {
  yield all([
    authWatcher(),
    carrierSagaWatcher(),
    vehicleSagaWatcher(),
    driverSagaWatcher(),
    placeSagaWatcher(),
    loadSagaWatcher(),
    intelSagaWatcher(),
    invoiceSagaWatcher(),
    dashboardSagaWatcher(),
    contactSagaWatcher(),
    customerSagaWatcher(),
    settingsSagaWatcher(),
  ]);
}
