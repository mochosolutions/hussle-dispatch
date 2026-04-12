export interface LanePreferenceEntry {
  origin?: string;
  destination?: string;
}

export interface StatePreferenceEntry {
  state: string;
  preference: string;
}

export interface SaveLanePreferencesInput {
  homeBaseCity?: string;
  homeBaseState?: string;
  maxDaysOut?: number;
  preferredLanes?: LanePreferenceEntry[];
  statePreferences?: StatePreferenceEntry[];
  freightPreferences?: string[];
}

export interface LanePreferencesSessionPort {
  getAnswers(carrierId: string): Promise<Record<string, unknown> | null>;
  updateAnswers(carrierId: string, answers: Record<string, unknown>): Promise<void>;
}
