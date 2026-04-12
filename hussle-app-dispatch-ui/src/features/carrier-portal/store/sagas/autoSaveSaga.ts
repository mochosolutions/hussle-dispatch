import { debounce, call, put, select } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { carrierPortalActions } from '../slices/carrierPortalSlice';
import { saveAnswer } from '../../../../utils/api/fleet/carrierPortalApi';

interface AnswerChangedPayload {
  questionId: string;
  value: unknown;
  phase?: number;
}

function* handleAutoSave(action: PayloadAction<AnswerChangedPayload>): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortal.token,
    );

    if (!token) {
      return;
    }

    yield call(saveAnswer, token, {
      questionId: action.payload.questionId,
      value: action.payload.value,
      phase: action.payload.phase,
    });

    yield put(carrierPortalActions.answerSaved());
  } catch (error: unknown) {
    yield put(carrierPortalActions.answerSaveFailed());
  }
}

export function* autoSaveSaga(): Generator {
  yield debounce(500, carrierPortalActions.answerChanged.type, handleAutoSave);
}
