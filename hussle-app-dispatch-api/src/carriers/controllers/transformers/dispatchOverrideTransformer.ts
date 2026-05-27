interface LoadOverrideData {
  id: string;
  organizationId: string;
  onboardingOverride: boolean;
  onboardingOverrideReason: string | null;
}

export interface DispatchOverrideResponse {
  id: string;
  onboardingOverride: boolean;
  onboardingOverrideReason: string | null;
}

export const toDispatchOverrideResponse = (load: LoadOverrideData): DispatchOverrideResponse => ({
  id: load.id,
  onboardingOverride: load.onboardingOverride,
  onboardingOverrideReason: load.onboardingOverrideReason,
});
