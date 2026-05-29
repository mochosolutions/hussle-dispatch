import type { OrgSettings, SettingsFormValues } from '../types';
import type { SettingsSchemaValues } from '../validators/settingsSchema';

/**
 * Builds the full SettingsFormValues from OrgSettings (or defaults when null).
 * minBookRateProfitMargin is multiplied by 100 so the form shows a percent (e.g. 15 instead of 0.15).
 */
export const buildSettingsFormValues = (settings: OrgSettings | null): SettingsFormValues => {
  const s = settings;
  return {
    defaultTonuFee: s?.defaultTonuFee ?? 250,
    prohibitedCommodities: s?.prohibitedCommodities ?? [],
    weeklyGrossTarget: s?.weeklyGrossTarget ?? 5000,
    defaultDetentionRate: s?.defaultDetentionRate ?? 75,
    detentionFreeHours: s?.detentionFreeHours ?? 2,
    minBookRateProfitMargin: Math.round((s?.minBookRateProfitMargin ?? 0.15) * 100),
    defaultMaxDaysOut: s?.defaultMaxDaysOut ?? 14,
    chainDepthThresholdMiles: s?.chainDepthThresholdMiles ?? 250,
    backhaulSearchRadiusMiles: s?.backhaulSearchRadiusMiles ?? 150,
    autoScrapingEnabled: s?.autoScrapingEnabled ?? true,
    loadIntelEmailAddress: s?.loadIntelEmailAddress ?? '',
    sesFromEmail: s?.sesFromEmail ?? '',
    companyLogoUrl: s?.companyLogoUrl ?? '',
    smsPrePickupLeadMinutes: s?.smsPrePickupLeadMinutes ?? 60,
    smsTransitIntervalMinutes: s?.smsTransitIntervalMinutes ?? 180,
    smsPostPickupEscalationMinutes: s?.smsPostPickupEscalationMinutes ?? 30,
    smsCooldownMinutes: s?.smsCooldownMinutes ?? 15,
    // OrgSettings.headquartersLatitude is number | null; ?? null collapses undefined (when s is null)
    headquartersLatitude: s !== null ? (s.headquartersLatitude ?? null) : null,
    headquartersLongitude: s !== null ? (s.headquartersLongitude ?? null) : null,
  };
};

const normalizeCoord = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(num) ? null : num;
};

/**
 * Transforms SettingsFormValues back to the API payload shape:
 * - minBookRateProfitMargin divided by 100 (percent → decimal)
 * - coord '' / null / NaN → null
 */
export const toUpdateSettingsPayload = (values: SettingsSchemaValues): SettingsFormValues => ({
  defaultTonuFee: values.defaultTonuFee,
  prohibitedCommodities: values.prohibitedCommodities,
  weeklyGrossTarget: values.weeklyGrossTarget,
  defaultDetentionRate: values.defaultDetentionRate,
  detentionFreeHours: values.detentionFreeHours,
  minBookRateProfitMargin: values.minBookRateProfitMargin / 100,
  defaultMaxDaysOut: values.defaultMaxDaysOut,
  chainDepthThresholdMiles: values.chainDepthThresholdMiles,
  backhaulSearchRadiusMiles: values.backhaulSearchRadiusMiles,
  autoScrapingEnabled: values.autoScrapingEnabled,
  loadIntelEmailAddress: values.loadIntelEmailAddress,
  sesFromEmail: values.sesFromEmail,
  companyLogoUrl: values.companyLogoUrl,
  smsPrePickupLeadMinutes: values.smsPrePickupLeadMinutes,
  smsTransitIntervalMinutes: values.smsTransitIntervalMinutes,
  smsPostPickupEscalationMinutes: values.smsPostPickupEscalationMinutes,
  smsCooldownMinutes: values.smsCooldownMinutes,
  headquartersLatitude: normalizeCoord(values.headquartersLatitude),
  headquartersLongitude: normalizeCoord(values.headquartersLongitude),
});
