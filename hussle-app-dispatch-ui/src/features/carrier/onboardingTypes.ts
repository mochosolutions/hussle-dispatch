// Types for the carrier onboarding detail view.
// Mirrors the API contract from .planning/carrier-onboarding/types.ts.

export interface OnboardingSession {
  id: string;
  carrierId: string;
  currentStepId: string | null;
  answers?: Record<string, unknown>;
  completedStepIds: string[];
  lastActiveAt: string;
  completedAt?: string | null;
  remindersSent?: number;
  lastReminderAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CostAnalysisResult {
  breakEvenRpm: number;
  minimumRatePerMile: number;
  totalMonthlyExpenses: number;
  fuelCostPerMile: number;
  projectedNetPerMonth: number;
  revenuePerMile: number;
  costProfileVersion: number;
  costProfileSource: string;
}

export interface LanePreferenceEntry {
  origin?: string;
  destination?: string;
}

export interface StatePreferenceEntry {
  state: string;
  preference: string;
}

export interface PortalDocument {
  id: string;
  documentType: string;
  fileName?: string;
  fileUrl?: string;
  reviewStatus: string;
  signatureData?: string;
  signedAt?: string | null;
  createdAt: string;
}

export interface CarrierOnboardingDetail {
  carrier: Record<string, unknown>;
  session: OnboardingSession;
  vehicles: Record<string, unknown>[];
  drivers: Record<string, unknown>[];
  documents: PortalDocument[];
  costAnalysis?: CostAnalysisResult;
  lanePreferences?: {
    homeBaseCity?: string;
    homeBaseState?: string;
    maxDaysOut?: number;
    preferredLanes?: LanePreferenceEntry[];
    statePreferences?: StatePreferenceEntry[];
    freightPreferences?: string[];
  };
}
