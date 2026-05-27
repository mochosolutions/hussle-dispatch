import type { OrgSettings } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

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
  headquartersLatitude: number | null;
  headquartersLongitude: number | null;
}

export interface OrganizationHq {
  headquartersLatitude: Decimal | null;
  headquartersLongitude: Decimal | null;
}

export interface UpdateOrganizationHqInput {
  headquartersLatitude: number | null;
  headquartersLongitude: number | null;
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
  headquartersLatitude?: number | null;
  headquartersLongitude?: number | null;
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
  getOrganizationHq(organizationId: string): Promise<OrganizationHq | null>;
  updateOrganizationHq(
    organizationId: string,
    input: UpdateOrganizationHqInput,
  ): Promise<void>;
}
