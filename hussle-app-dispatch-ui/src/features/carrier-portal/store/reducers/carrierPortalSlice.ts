// ---------------------------------------------------------------------------
// Carrier Portal V2 — page slice
//
// State shape per US-15 T-38:
//   - token: invite token (Bearer auth for portal API)
//   - session: engine Session (or null until loadSession resolves)
//   - loading: per-operation status map ('idle' | 'pending' | 'success' | 'failure')
//   - errors:  per-operation error message map
//   - lastSavedAt: ISO timestamp of the most recent successful write
//
// Mounted under `state.pages.carrierPortalV2` (see store/reducers/index.ts).
// ---------------------------------------------------------------------------

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { AgreementContext, Session } from 'features/carrier-portal/engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoadingStatus = 'idle' | 'pending' | 'success' | 'failure';

export type LoadingKey =
  | 'session'
  | 'submitStep'
  | 'agreement'
  | 'upload'
  | 'costAnalysis'
  | 'lanePreferences'
  | 'saveAndExit';

export interface CarrierPortalV2State {
  token: string | null;
  session: Session | null;
  loading: Record<string, LoadingStatus>;
  errors: Record<string, string>;
  lastSavedAt: string | null;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: CarrierPortalV2State = {
  token: null,
  session: null,
  loading: {},
  errors: {},
  lastSavedAt: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const markPending = (state: CarrierPortalV2State, key: LoadingKey): void => {
  state.loading[key] = 'pending';
  state.errors[key] = '';
};

const markSuccess = (state: CarrierPortalV2State, key: LoadingKey): void => {
  state.loading[key] = 'success';
  state.errors[key] = '';
};

const markFailure = (state: CarrierPortalV2State, key: LoadingKey, message: string): void => {
  state.loading[key] = 'failure';
  state.errors[key] = message;
};

const touchSavedAt = (state: CarrierPortalV2State): void => {
  state.lastSavedAt = new Date().toISOString();
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const carrierPortalV2Slice = createSlice({
  name: 'carrierPortalV2',
  initialState,
  reducers: {
    // ── token ─────────────────────────────────────────────────────────────
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },

    // ── loadSession ───────────────────────────────────────────────────────
    loadSession(state) {
      markPending(state, 'session');
    },
    loadSessionSuccess(state, action: PayloadAction<Session>) {
      state.session = action.payload;
      markSuccess(state, 'session');
      touchSavedAt(state);
    },
    loadSessionFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'session', action.payload);
    },

    // ── submitStep ────────────────────────────────────────────────────────
    submitStep(
      state,
      _action: PayloadAction<{ stepId: string; answers: Record<string, unknown> }>,
    ) {
      markPending(state, 'submitStep');
    },
    submitStepSuccess(state, action: PayloadAction<Session>) {
      state.session = action.payload;
      markSuccess(state, 'submitStep');
      touchSavedAt(state);
    },
    submitStepFailure(
      state,
      action: PayloadAction<{ error: string; code?: string; field?: string }>,
    ) {
      markFailure(state, 'submitStep', action.payload.error);
    },

    // ── fetchAgreement ────────────────────────────────────────────────────
    fetchAgreement(state, _action: PayloadAction<{ templateKey: string }>) {
      markPending(state, 'agreement');
    },
    fetchAgreementSuccess(state, action: PayloadAction<AgreementContext | null>) {
      if (state.session) {
        state.session.agreement = action.payload ?? undefined;
      }
      markSuccess(state, 'agreement');
    },
    fetchAgreementFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'agreement', action.payload);
    },

    // ── uploadDocument ────────────────────────────────────────────────────
    uploadDocument(state, _action: PayloadAction<{ documentType: string; file: File }>) {
      markPending(state, 'upload');
    },
    uploadDocumentSuccess(state, _action: PayloadAction<{ documentType: string }>) {
      markSuccess(state, 'upload');
      touchSavedAt(state);
    },
    uploadDocumentFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'upload', action.payload);
    },

    // ── saveCostAnalysis ──────────────────────────────────────────────────
    saveCostAnalysis(state, _action: PayloadAction<Record<string, unknown>>) {
      markPending(state, 'costAnalysis');
    },
    saveCostAnalysisSuccess(state) {
      markSuccess(state, 'costAnalysis');
      touchSavedAt(state);
    },
    saveCostAnalysisFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'costAnalysis', action.payload);
    },

    // ── saveLanePreferences ───────────────────────────────────────────────
    saveLanePreferences(state, _action: PayloadAction<Record<string, unknown>>) {
      markPending(state, 'lanePreferences');
    },
    saveLanePreferencesSuccess(state) {
      markSuccess(state, 'lanePreferences');
      touchSavedAt(state);
    },
    saveLanePreferencesFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'lanePreferences', action.payload);
    },

    // ── saveAndExit ───────────────────────────────────────────────────────
    saveAndExit(
      state,
      _action: PayloadAction<{ stepId: string; answers: Record<string, unknown> }>,
    ) {
      markPending(state, 'saveAndExit');
    },
    saveAndExitSuccess(state) {
      markSuccess(state, 'saveAndExit');
      touchSavedAt(state);
    },
    saveAndExitFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'saveAndExit', action.payload);
    },

    // ── navigateToStep ────────────────────────────────────────────────────
    // Client-side back-navigation used by ReviewStep "Edit" links.
    // NOTE: server-side step update (so refresh lands on the same step) is
    // deferred — no saga consumes this action yet.
    navigateToStep(state, action: PayloadAction<{ stepId: string }>) {
      if (state.session) {
        state.session.currentStepId = action.payload.stepId;
      }
    },

    // ── direct setters ────────────────────────────────────────────────────
    setLastSavedAt(state, action: PayloadAction<string>) {
      state.lastSavedAt = action.payload;
    },
  },
});

export const carrierPortalV2Actions = carrierPortalV2Slice.actions;
export const carrierPortalV2Reducer = carrierPortalV2Slice.reducer;
export default carrierPortalV2Slice;
