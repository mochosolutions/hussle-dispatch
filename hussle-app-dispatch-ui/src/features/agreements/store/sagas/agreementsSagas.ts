import { call, put, takeLatest, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';

import { notify } from 'features/ui/store/reducers/notificationSlice';
import {
  listAgreementsByCarrier,
  requestAgreement,
  createManualAgreement,
  voidAgreement,
} from 'utils/api/agreements';

import {
  fetchAgreementsRequest,
  fetchAgreementsSuccess,
  fetchAgreementsFailure,
  createManualAgreementRequest,
  createManualAgreementSuccess,
  createManualAgreementFailure,
  requestAgreementRequest,
  requestAgreementSuccess,
  requestAgreementFailure,
  voidAgreementRequest,
  voidAgreementSuccess,
  voidAgreementFailure,
} from '../reducers/agreementsSlice';

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

function* fetchAgreementsSaga(
  action: PayloadAction<{ carrierId: string }>,
): Generator {
  const { carrierId } = action.payload;
  try {
    const agreements = (yield call(
      listAgreementsByCarrier,
      carrierId,
    )) as SagaReturnType<typeof listAgreementsByCarrier>;
    yield put(fetchAgreementsSuccess({ carrierId, agreements }));
  } catch (error: unknown) {
    const message = errorMessage(error, 'Failed to load agreements');
    yield put(fetchAgreementsFailure({ carrierId, error: message }));
    yield put(notify({ message, variant: 'error' }));
  }
}

function* createManualAgreementSaga(
  action: PayloadAction<Parameters<typeof createManualAgreement>[0]>,
): Generator {
  try {
    const agreement = (yield call(
      createManualAgreement,
      action.payload,
    )) as SagaReturnType<typeof createManualAgreement>;
    yield put(createManualAgreementSuccess({ agreement }));
    yield put(notify({ message: 'Signed agreement uploaded', variant: 'success' }));
  } catch (error: unknown) {
    const message = errorMessage(error, 'Failed to upload signed agreement');
    yield put(createManualAgreementFailure({ error: message }));
    yield put(notify({ message, variant: 'error' }));
  }
}

function* requestAgreementSaga(
  action: PayloadAction<Parameters<typeof requestAgreement>[0]>,
): Generator {
  try {
    const agreement = (yield call(
      requestAgreement,
      action.payload,
    )) as SagaReturnType<typeof requestAgreement>;
    yield put(requestAgreementSuccess({ agreement }));
    yield put(
      notify({
        message: 'Signing request created — the carrier will see it on their next portal visit.',
        variant: 'success',
      }),
    );
  } catch (error: unknown) {
    const message = errorMessage(error, 'Failed to create signing request');
    yield put(requestAgreementFailure({ error: message }));
    yield put(notify({ message, variant: 'error' }));
  }
}

function* voidAgreementSaga(
  action: PayloadAction<Parameters<typeof voidAgreement>[0]>,
): Generator {
  try {
    const agreement = (yield call(
      voidAgreement,
      action.payload,
    )) as SagaReturnType<typeof voidAgreement>;
    yield put(voidAgreementSuccess({ agreement }));
    yield put(notify({ message: 'Agreement voided', variant: 'success' }));
  } catch (error: unknown) {
    const message = errorMessage(error, 'Failed to void agreement');
    yield put(voidAgreementFailure({ error: message }));
    yield put(notify({ message, variant: 'error' }));
  }
}

export function* agreementsSagasWatcher(): Generator {
  yield takeLatest(fetchAgreementsRequest.type, fetchAgreementsSaga);
  yield takeLatest(createManualAgreementRequest.type, createManualAgreementSaga);
  yield takeLatest(requestAgreementRequest.type, requestAgreementSaga);
  yield takeLatest(voidAgreementRequest.type, voidAgreementSaga);
}
