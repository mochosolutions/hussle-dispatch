import { takeLatest } from 'redux-saga/effects';
import { fetchCustomersSaga } from './fetchCustomersSaga';
import { fetchCustomerDetailsSaga } from './fetchCustomerDetailsSaga';
import { createCustomerSaga } from './createCustomerSaga';
import { updateCustomerSaga } from './updateCustomerSaga';
import { deleteCustomerSaga } from './deleteCustomerSaga';
import { fetchNotificationSettingsSaga } from './fetchNotificationSettingsSaga';
import { updateNotificationSettingsSaga } from './updateNotificationSettingsSaga';
import { customerPageSlice } from '../reducers/customerPageSlice';
import {
  fetchNotificationSettingsRequest,
  updateNotificationSettingsRequest,
} from '../reducers/customerPageSlice';

export const { actions: customerPageActions } = customerPageSlice;

export function* customerSagaWatcher(): Generator {
  yield takeLatest(customerPageActions.fetchAllRequest.type, fetchCustomersSaga);
  yield takeLatest(customerPageActions.fetchByIdRequest.type, fetchCustomerDetailsSaga);
  yield takeLatest(customerPageActions.createRequest.type, createCustomerSaga);
  yield takeLatest(customerPageActions.updateRequest.type, updateCustomerSaga);
  yield takeLatest(customerPageActions.deleteRequest.type, deleteCustomerSaga);
  yield takeLatest(fetchNotificationSettingsRequest.type, fetchNotificationSettingsSaga);
  yield takeLatest(updateNotificationSettingsRequest.type, updateNotificationSettingsSaga);
}
