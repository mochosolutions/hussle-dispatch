// Frontend types mirroring hussle-app-dispatch-api/src/settings/types/settingsTypes.ts

export interface OrgSettings {
  id: string;
  organizationId: string;
  defaultTonuFee: number;
  prohibitedCommodities: string[];
  weeklyGrossTarget: number;
  defaultDetentionRate: number;
  detentionFreeHours: number;
  minBookRateProfitMargin: number;
  defaultMaxDaysOut: number;
  chainDepthThresholdMiles: number;
  backhaulSearchRadiusMiles: number;
  autoScrapingEnabled: boolean;
  loadIntelEmailAddress: string | null;
  sesFromEmail: string | null;
  companyLogoUrl: string | null;
}

export interface SettingsFormValues {
  defaultTonuFee: number;
  prohibitedCommodities: string[];
  weeklyGrossTarget: number;
  defaultDetentionRate: number;
  detentionFreeHours: number;
  minBookRateProfitMargin: number;
  defaultMaxDaysOut: number;
  chainDepthThresholdMiles: number;
  backhaulSearchRadiusMiles: number;
  autoScrapingEnabled: boolean;
  loadIntelEmailAddress: string;
  sesFromEmail: string;
  companyLogoUrl: string;
}

export interface SettingsPageState {
  settings: OrgSettings | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
}

export interface FetchSettingsSuccessPayload {
  settings: OrgSettings;
}

export interface UpdateSettingsRequestPayload {
  values: SettingsFormValues;
}

export interface UpdateSettingsFailurePayload {
  error: string;
}
