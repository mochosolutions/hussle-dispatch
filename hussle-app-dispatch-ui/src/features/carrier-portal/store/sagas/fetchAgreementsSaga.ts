import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import type { AgreementContext, AgreementStatus } from 'features/carrier-portal/engine';
import { getAgreementsV2 } from 'utils/api/carrierPortal/v2';
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

/**
 * Project a single AgreementSnapshotV2 → engine AgreementContext.
 * Exported so markAgreementSignedMockSaga can reuse it.
 */
export const projectAgreementSnapshot = (raw: AgreementSnapshotV2): AgreementContext => ({
  id: raw.id,
  templateKey: raw.templateKey,
  status: toAgreementStatus(raw.status),
  embedUrl: raw.embedUrl,
  signedAt: raw.signedAt,
  signedFieldsLocked: raw.signedFieldsLocked,
  mock: raw.mock,
  variables: raw.variables,
});

const projectAgreementsRecord = (
  raw: Record<string, AgreementSnapshotV2>,
): Record<string, AgreementContext> => {
  const result: Record<string, AgreementContext> = {};
  for (const [key, snapshot] of Object.entries(raw)) {
    result[key] = projectAgreementSnapshot(snapshot);
  }
  return result;
};

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleFetchAgreements(
  action: PayloadAction<{ templateKeys: string[] }>,
): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(carrierPortalV2Actions.fetchAgreementsFailure('No token available'));
      return;
    }

    const raw: Record<string, AgreementSnapshotV2> = yield call(
      getAgreementsV2,
      token,
      action.payload.templateKeys,
    );
    yield put(
      carrierPortalV2Actions.fetchAgreementsSuccess({
        agreements: projectAgreementsRecord(raw),
      }),
    );
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to fetch agreements');
    yield put(carrierPortalV2Actions.fetchAgreementsFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* fetchAgreementsSaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.fetchAgreements.type, handleFetchAgreements);
}
