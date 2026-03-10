import { call, put } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { deleteContact } from 'utils/api/fleet/contactApi';
import {
  deleteContactRequest,
  deleteContactSuccess,
  deleteContactFailure,
} from '../reducers/contactPageSlice';
import { contactActions } from '../reducers/contactEntitySlice';

export function* deleteContactSaga(action: ReturnType<typeof deleteContactRequest>): Generator {
  const { id } = action.payload;

  try {
    yield call(deleteContact, id);

    yield put(contactActions.removeOne(id));
    yield put(deleteContactSuccess({ id }));

    yield call(enqueueSnackbar, 'Contact deleted', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete contact';
    yield put(deleteContactFailure({ error: errorMessage, id }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
