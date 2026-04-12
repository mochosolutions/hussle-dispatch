export interface OnboardingDetailPort {
  getOnboardingDetail(
    carrierId: string,
    organizationId: string,
  ): Promise<OnboardingDetail | null>;
}

export interface OnboardingDetail {
  carrier: Record<string, unknown>;
  session: Record<string, unknown> | null;
  vehicles: Record<string, unknown>[];
  drivers: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  lanePreferences?: Record<string, unknown>;
}
