import { takeLatest } from 'redux-saga/effects';
import { contactPageSlice } from '../reducers/contactPageSlice';
import { fetchContactsSaga } from './fetchContactsSaga';
import { createContactSaga } from './createContactSaga';
import { updateContactSaga } from './updateContactSaga';
import { deleteContactSaga } from './deleteContactSaga';

export const { actions: contactPageActions } = contactPageSlice;

export function* contactSagaWatcher(): Generator {
  yield takeLatest(contactPageActions.fetchAllRequest.type, fetchContactsSaga);
  yield takeLatest(contactPageActions.createRequest.type, createContactSaga);
  yield takeLatest(contactPageActions.updateRequest.type, updateContactSaga);
  yield takeLatest(contactPageActions.deleteRequest.type, deleteContactSaga);
}
