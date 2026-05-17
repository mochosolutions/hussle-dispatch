// V2 lane preferences input — see plan.md § Lane preferences storage and PLAN-DELTA § Delta 2.

export type LaneState = 'preferred' | 'avoid';
export type ScheduleState = 'on' | 'flex' | 'off';
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type SchedulePreset =
  | 'weekdays'
  | 'weekdays_flex_fri'
  | 'long_haul'
  | 'regional_61'
  | 'custom';
export type FreightTypeId =
  | 'dry_van'
  | 'reefer'
  | 'flatbed'
  | 'step_deck'
  | 'power_only'
  | 'containers'
  | 'hazmat'
  | 'oversize'
  | 'auto_haul'
  | 'tanker';
export type FreightState = 'on' | 'avoid';

export interface FleetLanePreferences {
  lanes: Record<string, LaneState>;
  schedule: Record<DayKey, ScheduleState>;
  schedulePreset: SchedulePreset;
  homeBaseCity?: string | null;
  homeBaseState?: string | null;
  maxMilesFromHome?: number | 'no_limit';
  maxDaysOut?: number;
  freightTypes: Record<FreightTypeId, FreightState>;
}

export interface SaveLanePreferencesInput {
  fleet: FleetLanePreferences;
  // Per-driver overrides: each driver may override any subset of fleet sections.
  // Absence of a key = inherit fleet default.
  overrides: Record<string, Partial<FleetLanePreferences>>;
}

export interface LanePreferencesWritePort {
  saveTransactional(
    carrierId: string,
    organizationId: string,
    input: SaveLanePreferencesInput,
  ): Promise<void>;
}
