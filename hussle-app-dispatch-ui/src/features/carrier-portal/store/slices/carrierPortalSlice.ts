import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  CarrierPortalSummary,
  CostAnalysisResult,
  OnboardingSession,
  SaveCompanyRequest,
  SaveCostAnalysisRequest,
  SaveDriversRequest,
  SaveEquipmentRequest,
  SaveLanePreferencesRequest,
} from 'features/carrier-portal/types';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface CarrierPortalState {
  token: string | null;
  session: OnboardingSession | null;
  carrier: CarrierPortalSummary | null;
  answers: Record<string, unknown>;
  loading: boolean;
  error: string | null;
  savingAnswer: boolean;
  savingPhase: boolean;
  costAnalysisResult: CostAnalysisResult | null;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: CarrierPortalState = {
  token: null,
  session: null,
  carrier: null,
  answers: {},
  loading: false,
  error: null,
  savingAnswer: false,
  savingPhase: false,
  costAnalysisResult: null,
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const carrierPortalSlice = createSlice({
  name: 'carrierPortal',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    fetchSession(state) {
      state.loading = true;
      state.error = null;
    },
    fetchSessionSuccess(
      state,
      action: PayloadAction<{
        session: OnboardingSession;
        carrier: CarrierPortalSummary;
        answers: Record<string, unknown>;
      }>,
    ) {
      state.session = action.payload.session;
      state.carrier = action.payload.carrier;
      state.answers = action.payload.answers;
      state.loading = false;
      state.error = null;
    },
    fetchSessionFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    answerChanged(
      state,
      action: PayloadAction<{ questionId: string; value: unknown; phase?: number }>,
    ) {
      state.answers[action.payload.questionId] = action.payload.value;
      state.savingAnswer = true;
    },
    answerSaved(state) {
      state.savingAnswer = false;
    },
    answerSaveFailed(state) {
      state.savingAnswer = false;
    },
    sessionCompleted(state, action: PayloadAction<{ completedAt: string }>) {
      if (state.session) {
        state.session.completedAt = action.payload.completedAt;
      }
    },

    // Phase saves — company
    saveCompany(state, _action: PayloadAction<SaveCompanyRequest>) {
      state.savingPhase = true;
      state.error = null;
    },
    saveCompanySuccess(state) {
      state.savingPhase = false;
    },
    saveCompanyFailure(state, action: PayloadAction<string>) {
      state.savingPhase = false;
      state.error = action.payload;
    },

    // Phase saves — equipment
    saveEquipment(state, _action: PayloadAction<SaveEquipmentRequest>) {
      state.savingPhase = true;
      state.error = null;
    },
    saveEquipmentSuccess(state) {
      state.savingPhase = false;
    },
    saveEquipmentFailure(state, action: PayloadAction<string>) {
      state.savingPhase = false;
      state.error = action.payload;
    },

    // Phase saves — drivers
    saveDrivers(state, _action: PayloadAction<SaveDriversRequest>) {
      state.savingPhase = true;
      state.error = null;
    },
    saveDriversSuccess(state) {
      state.savingPhase = false;
    },
    saveDriversFailure(state, action: PayloadAction<string>) {
      state.savingPhase = false;
      state.error = action.payload;
    },

    // Phase saves — cost analysis
    saveCostAnalysis(state, _action: PayloadAction<SaveCostAnalysisRequest>) {
      state.savingPhase = true;
      state.error = null;
    },
    saveCostAnalysisSuccess(state, action: PayloadAction<CostAnalysisResult>) {
      state.savingPhase = false;
      state.costAnalysisResult = action.payload;
    },
    saveCostAnalysisFailure(state, action: PayloadAction<string>) {
      state.savingPhase = false;
      state.error = action.payload;
    },

    // Phase saves — lane preferences
    saveLanePreferences(state, _action: PayloadAction<SaveLanePreferencesRequest>) {
      state.savingPhase = true;
      state.error = null;
    },
    saveLanePreferencesSuccess(state) {
      state.savingPhase = false;
    },
    saveLanePreferencesFailure(state, action: PayloadAction<string>) {
      state.savingPhase = false;
      state.error = action.payload;
    },

    // Complete onboarding
    completeOnboarding(state) {
      state.savingPhase = true;
      state.error = null;
    },
    completeOnboardingSuccess(state, action: PayloadAction<OnboardingSession>) {
      state.savingPhase = false;
      state.session = action.payload;
    },
    completeOnboardingFailure(state, action: PayloadAction<string>) {
      state.savingPhase = false;
      state.error = action.payload;
    },
  },
});

export const carrierPortalActions = carrierPortalSlice.actions;
export const carrierPortalReducer = carrierPortalSlice.reducer;
export default carrierPortalSlice;
