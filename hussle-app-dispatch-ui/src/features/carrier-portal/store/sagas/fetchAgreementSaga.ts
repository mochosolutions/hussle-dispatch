import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import type { AgreementContext, AgreementStatus } from 'features/carrier-portal/engine';
import { getAgreementV2 } from 'utils/api/carrierPortal/v2';
import type { AgreementSnapshotV2 } from 'utils/api/carrierPortal/v2';

import { carrierPortalV2Actions } from '../reducers/carrierPortalSlice';
import { extractErrorMessage } from './sessionAdapters';

const AGREEMENT_STATUSES: readonly AgreementStatus[] = [
  'PENDING',
  'SIGNED',
  'VOIDED',
  'EXPIRED',
  'DECLINED',
  'DRAFT',
] as const;

const toAgreementStatus = (raw: unknown): AgreementStatus => {
  if (typeof raw !== 'string') {
    return 'PENDING';
  }
  const upper = raw.toUpperCase();
  const match = AGREEMENT_STATUSES.find((status) => status === upper);
  return match ?? 'PENDING';
};

const projectAgreement = (raw: AgreementSnapshotV2 | null): AgreementContext | null => {
  if (!raw) {
    return null;
  }
  return {
    id: raw.id,
    status: toAgreementStatus(raw.status),
    embedUrl: raw.embedUrl,
    signedFieldsLocked: raw.signedFieldsLocked,
  };
};

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleFetchAgreement(
  action: PayloadAction<{ templateKey: string }>,
): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(carrierPortalV2Actions.fetchAgreementFailure('No token available'));
      return;
    }

    const raw: AgreementSnapshotV2 | null = yield call(
      getAgreementV2,
      token,
      action.payload.templateKey,
    );
    yield put(carrierPortalV2Actions.fetchAgreementSuccess(projectAgreement(raw)));
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to fetch agreement');
    yield put(carrierPortalV2Actions.fetchAgreementFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* fetchAgreementSaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.fetchAgreement.type, handleFetchAgreement);
}
