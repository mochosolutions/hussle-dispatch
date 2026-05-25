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
import type { DriverInput, SaveCompanyRequest, VehicleInput } from 'utils/api/carrierPortal/v2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoadingStatus = 'idle' | 'pending' | 'success' | 'failure';

export type LoadingKey =
  | 'session'
  | 'submitStep'
  | 'agreement'
  | 'agreementMockSign'
  | 'upload'
  | 'costAnalysis'
  | 'lanePreferences'
  | 'saveAndExit'
  | 'company'
  | 'equipment'
  | 'drivers'
  | 'voidAndReSign'
  | 'completeSession';

export interface SaveCompanyPayload {
  fields: SaveCompanyRequest;
  hasMcAuthority?: string;
  hasDba?: string;
  // Set by the mid-signing edit guard. When true, the saga first voids any
  // signed agreements that embed the changed identity fields, then performs
  // the save and navigates the carrier back to /sign-agreement.
  voidPriorAgreements?: boolean;
  // Field name(s) that triggered the void+re-sign. Used for both UX copy
  // (which field the carrier just changed) and backend audit metadata.
  changedIdentityFields?: ('legalName' | 'mcNumber' | 'dotNumber')[];
}

export interface SaveEquipmentPayload {
  vehicles: VehicleInput[];
}

export interface SaveDriversPayload {
  hasAdditionalDrivers: boolean;
  drivers?: DriverInput[];
}

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

    // ── fetchAgreements (multi-key) ──────────────────────────────────────
    fetchAgreements(state, _action: PayloadAction<{ templateKeys: string[] }>) {
      markPending(state, 'agreement');
    },
    fetchAgreementsSuccess(
      state,
      action: PayloadAction<{ agreements: Record<string, AgreementContext> }>,
    ) {
      if (state.session) {
        state.session.agreements = action.payload.agreements;
      }
      markSuccess(state, 'agreement');
    },
    fetchAgreementsFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'agreement', action.payload);
    },

    // ── markAgreementSignedMock ──────────────────────────────────────────
    markAgreementSignedMock(state, _action: PayloadAction<{ agreementId: string }>) {
      markPending(state, 'agreementMockSign');
    },
    markAgreementSignedMockSuccess(
      state,
      action: PayloadAction<{ agreement: AgreementContext }>,
    ) {
      if (state.session) {
        const { agreement } = action.payload;
        state.session.agreements = {
          ...(state.session.agreements ?? {}),
          [agreement.templateKey]: agreement,
        };
      }
      markSuccess(state, 'agreementMockSign');
      touchSavedAt(state);
    },
    markAgreementSignedMockFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'agreementMockSign', action.payload);
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
    saveCostAnalysis(state, action: PayloadAction<Record<string, unknown>>) {
      markPending(state, 'costAnalysis');
      // Optimistic write: project the submitted ledger onto
      // session.costAnalysis so back-navigation prefills the cost-analysis
      // form without waiting for a session refetch. The saga sends the
      // same payload shape to the server, where it's stored as
      // answers.costAnalysis (the projection source).
      if (state.session) {
        state.session.costAnalysis = action.payload;
      }
    },
    saveCostAnalysisSuccess(state) {
      markSuccess(state, 'costAnalysis');
      touchSavedAt(state);
    },
    saveCostAnalysisFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'costAnalysis', action.payload);
    },

    // ── saveCompany ───────────────────────────────────────────────────────
    saveCompany(state, action: PayloadAction<SaveCompanyPayload>) {
      markPending(state, 'company');
      // Optimistic write: project the submitted typed fields onto
      // session.company so back-navigation prefills correctly without
      // waiting for a session refetch. The typed Carrier columns are the
      // durable source; this in-memory mirror just keeps the form's
      // prefillFrom paths populated within the same session.
      if (state.session) {
        state.session.company = {
          ...state.session.company,
          ...action.payload.fields,
        };
      }
    },
    saveCompanySuccess(state) {
      markSuccess(state, 'company');
      touchSavedAt(state);
    },
    saveCompanyFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'company', action.payload);
    },

    // ── saveEquipment ─────────────────────────────────────────────────────
    saveEquipment(state, action: PayloadAction<SaveEquipmentPayload>) {
      markPending(state, 'equipment');
      // Optimistic write: project the submitted vehicles onto session.vehicles
      // so back-navigation prefills correctly without waiting for a refetch.
      // The next session refetch will reconcile from the typed Vehicle table.
      if (state.session) {
        state.session.vehicles = action.payload.vehicles.map((v) => ({
          id: v.id ?? '',
          category: v.category,
          year: v.year ?? null,
          make: v.make ?? null,
          model: v.model ?? null,
          vin: v.vin ?? null,
          licensePlate: v.licensePlate ?? null,
          gvwr: v.gvwr ?? null,
        }));
      }
    },
    saveEquipmentSuccess(state) {
      markSuccess(state, 'equipment');
      touchSavedAt(state);
    },
    saveEquipmentFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'equipment', action.payload);
    },

    // ── saveDrivers ───────────────────────────────────────────────────────
    saveDrivers(state, _action: PayloadAction<SaveDriversPayload>) {
      markPending(state, 'drivers');
    },
    saveDriversSuccess(state) {
      markSuccess(state, 'drivers');
      touchSavedAt(state);
    },
    saveDriversFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'drivers', action.payload);
    },

    // ── saveLanePreferences ───────────────────────────────────────────────
    saveLanePreferences(state, action: PayloadAction<Record<string, unknown>>) {
      markPending(state, 'lanePreferences');
      // Optimistic write: project the submitted payload into
      // session.lanePreferences.mirror so back-navigation prefills the form
      // without waiting for a session refetch.
      if (state.session) {
        state.session.lanePreferences = {
          ...(state.session.lanePreferences ?? {
            homeBaseCity: null,
            homeBaseState: null,
            maxDaysOut: null,
            preferredLanes: null,
            weeklySchedule: null,
            freightPreferences: null,
            mirror: null,
          }),
          mirror: action.payload,
        };
      }
    },
    saveLanePreferencesSuccess(state) {
      markSuccess(state, 'lanePreferences');
      touchSavedAt(state);
    },
    saveLanePreferencesFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'lanePreferences', action.payload);
    },

    // ── completeSession (B9 — terminal complete step) ─────────────────────
    completeSession(state) {
      markPending(state, 'completeSession');
    },
    completeSessionSuccess(state, action: PayloadAction<{ completedAt: string | null }>) {
      if (state.session) {
        state.session.completedAt = action.payload.completedAt;
      }
      markSuccess(state, 'completeSession');
      touchSavedAt(state);
    },
    completeSessionFailure(state, action: PayloadAction<string>) {
      markFailure(state, 'completeSession', action.payload);
    },
    /**
     * Clear stale `completeSession` loading/error state. CompleteStep fires
     * this on mount so a prior-attempt failure doesn't immediately re-trigger
     * the recovery redirect when the carrier returns from /sign-agreement.
     */
    completeSessionReset(state) {
      state.loading.completeSession = 'idle';
      state.errors.completeSession = '';
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
