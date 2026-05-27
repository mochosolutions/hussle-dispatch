import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import { saveCompanyV2, submitStepV2, voidForReSignV2 } from 'utils/api/carrierPortal/v2';
import type { Session } from 'features/carrier-portal/engine';
import { getNavigate } from 'mocho/utils/getNavigate';

import {
  carrierPortalV2Actions,
  type SaveCompanyPayload,
} from '../reducers/carrierPortalSlice';
import {
  advanceCurrentStep,
  extractErrorMessage,
  mergeSubmitStepResponse,
} from './sessionAdapters';

const COMPANY_STEP_ID = 'company-authority-question';

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleSaveCompany(action: PayloadAction<SaveCompanyPayload>): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(carrierPortalV2Actions.saveCompanyFailure('Session expired'));
      yield call(enqueueSnackbar, 'Session expired', { variant: 'error' });
      return;
    }

    // Mid-signing edit guard: when the carrier confirmed via ConfirmReSignDialog,
    // void any signed agreements that embed the changed identity fields BEFORE
    // persisting the field change. This keeps the agreement table consistent
    // with the carrier identity at all times — no window where a signed
    // agreement references a now-changed legal name / MC / DOT.
    if (
      action.payload.voidPriorAgreements &&
      action.payload.changedIdentityFields &&
      action.payload.changedIdentityFields.length > 0
    ) {
      yield call(voidForReSignV2, token, {
        changedFields: action.payload.changedIdentityFields,
      });
    }

    yield call(saveCompanyV2, token, action.payload.fields);
    yield put(carrierPortalV2Actions.saveCompanySuccess());

    // Follow-up submitStep call advances currentStepId AND persists the
    // engine-relevant answers (hasMcAuthority + hasDba) so visibility
    // predicates on later steps still resolve correctly.
    const session: Session | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.session,
    );
    const existing = (session?.answers[COMPANY_STEP_ID] ?? {}) as Record<string, unknown>;
    const hasMcAuthority =
      action.payload.hasMcAuthority ?? (existing.hasMcAuthority as string | undefined);
    const hasDba = action.payload.hasDba ?? (existing.hasDba as string | undefined);

    const engineAnswers: Record<string, unknown> = {};
    if (hasMcAuthority !== undefined) {
      engineAnswers.hasMcAuthority = hasMcAuthority;
    }
    if (hasDba !== undefined) {
      engineAnswers.hasDba = hasDba;
    }

    const raw: unknown = yield call(submitStepV2, token, {
      stepId: COMPANY_STEP_ID,
      answers: engineAnswers,
    });

    if (session) {
      const merged = mergeSubmitStepResponse(session, raw);
      yield put(carrierPortalV2Actions.submitStepSuccess(advanceCurrentStep(merged)));
    }

    // After void+re-sign, redirect the carrier back to the signing step so
    // they can re-sign the now-voided agreement(s). The fetchAgreements
    // saga running on the signing step's mount will see the agreements in
    // VOIDED state and surface the sign UX.
    if (action.payload.voidPriorAgreements) {
      const navigate = (yield call(getNavigate)) as (path: string) => void;
      yield call(navigate, `/carrier-portal/${token}/sign-agreement`);
    }
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to save company information');
    yield put(carrierPortalV2Actions.saveCompanyFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* saveCompanySaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.saveCompany.type, handleSaveCompany);
}
