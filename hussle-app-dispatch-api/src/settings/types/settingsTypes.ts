import type { OrgSettings } from '@prisma/client';

// ---------------------------------------------------------------------------
// Response type
// ---------------------------------------------------------------------------

export interface OrgSettingsResponse {
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
  smsPrePickupLeadMinutes: number;
  smsTransitIntervalMinutes: number;
  smsPostPickupEscalationMinutes: number;
  smsCooldownMinutes: number;
}

// ---------------------------------------------------------------------------
// Update input
// ---------------------------------------------------------------------------

export interface UpdateSettingsInput {
  organizationId: string;
  defaultTonuFee?: number;
  prohibitedCommodities?: string[];
  weeklyGrossTarget?: number;
  defaultDetentionRate?: number;
  detentionFreeHours?: number;
  minBookRateProfitMargin?: number;
  defaultMaxDaysOut?: number;
  chainDepthThresholdMiles?: number;
  backhaulSearchRadiusMiles?: number;
  autoScrapingEnabled?: boolean;
  loadIntelEmailAddress?: string;
  sesFromEmail?: string;
  companyLogoUrl?: string;
  smsPrePickupLeadMinutes?: number;
  smsTransitIntervalMinutes?: number;
  smsPostPickupEscalationMinutes?: number;
  smsCooldownMinutes?: number;
}

// ---------------------------------------------------------------------------
// Repo port
// ---------------------------------------------------------------------------

export interface SettingsRepoPort {
  findByOrganizationId(organizationId: string): Promise<OrgSettings | null>;
  upsert(
    organizationId: string,
    data: Partial<UpdateSettingsInput>,
  ): Promise<OrgSettings>;
}
