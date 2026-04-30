import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getContact } from 'utils/api/fleet/contactApi';
import { contactActions } from '../reducers/contactEntitySlice';
import {
  fetchContactDetailsRequest,
  fetchContactDetailsSuccess,
  fetchContactDetailsFailure,
} from '../reducers/contactPageSlice';

export function* fetchContactDetailsSaga(
  action: ReturnType<typeof fetchContactDetailsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const response = (yield call(getContact, id)) as SagaReturnType<typeof getContact>;

    yield put(contactActions.upsertOne(response));
    yield put(fetchContactDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load contact details';
    yield put(fetchContactDetailsFailure({ id, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
