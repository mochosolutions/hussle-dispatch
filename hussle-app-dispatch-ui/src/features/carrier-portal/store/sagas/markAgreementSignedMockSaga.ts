import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import { mockSignAgreementV2 } from 'utils/api/carrierPortal/v2';
import type { AgreementSnapshotV2 } from 'utils/api/carrierPortal/v2';

import { carrierPortalV2Actions } from '../reducers/carrierPortalSlice';
import { projectAgreementSnapshot } from './fetchAgreementsSaga';
import { extractErrorMessage } from './sessionAdapters';

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleMarkAgreementSignedMock(
  action: PayloadAction<{ agreementId: string }>,
): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(
        carrierPortalV2Actions.markAgreementSignedMockFailure('No token available'),
      );
      return;
    }

    const raw: AgreementSnapshotV2 = yield call(
      mockSignAgreementV2,
      token,
      action.payload.agreementId,
    );
    yield put(
      carrierPortalV2Actions.markAgreementSignedMockSuccess({
        agreement: projectAgreementSnapshot(raw),
      }),
    );
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to mark agreement as signed');
    yield put(carrierPortalV2Actions.markAgreementSignedMockFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* markAgreementSignedMockSaga(): Generator {
  yield takeLatest(
    carrierPortalV2Actions.markAgreementSignedMock.type,
    handleMarkAgreementSignedMock,
  );
}
