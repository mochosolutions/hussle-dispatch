import type { Request } from 'express';
import type { UpdateSettingsInput } from '../../types/settingsTypes';

export const updateSettingsMapper = (req: Request): UpdateSettingsInput => {
  const input: UpdateSettingsInput = { organizationId: req.organizationId ?? '' };

  if (req.body.defaultTonuFee !== undefined) {
    input.defaultTonuFee = req.body.defaultTonuFee;
  }
  if (req.body.prohibitedCommodities !== undefined) {
    input.prohibitedCommodities = req.body.prohibitedCommodities;
  }
  if (req.body.weeklyGrossTarget !== undefined) {
    input.weeklyGrossTarget = req.body.weeklyGrossTarget;
  }
  if (req.body.defaultDetentionRate !== undefined) {
    input.defaultDetentionRate = req.body.defaultDetentionRate;
  }
  if (req.body.detentionFreeHours !== undefined) {
    input.detentionFreeHours = req.body.detentionFreeHours;
  }
  if (req.body.minBookRateProfitMargin !== undefined) {
    input.minBookRateProfitMargin = req.body.minBookRateProfitMargin;
  }
  if (req.body.defaultMaxDaysOut !== undefined) {
    input.defaultMaxDaysOut = req.body.defaultMaxDaysOut;
  }
  if (req.body.chainDepthThresholdMiles !== undefined) {
    input.chainDepthThresholdMiles = req.body.chainDepthThresholdMiles;
  }
  if (req.body.backhaulSearchRadiusMiles !== undefined) {
    input.backhaulSearchRadiusMiles = req.body.backhaulSearchRadiusMiles;
  }
  if (req.body.autoScrapingEnabled !== undefined) {
    input.autoScrapingEnabled = req.body.autoScrapingEnabled;
  }
  if (req.body.loadIntelEmailAddress !== undefined) {
    input.loadIntelEmailAddress = req.body.loadIntelEmailAddress;
  }
  if (req.body.sesFromEmail !== undefined) {
    input.sesFromEmail = req.body.sesFromEmail;
  }
  if (req.body.companyLogoUrl !== undefined) {
    input.companyLogoUrl = req.body.companyLogoUrl;
  }
  if (req.body.smsPrePickupLeadMinutes !== undefined) {
    input.smsPrePickupLeadMinutes = req.body.smsPrePickupLeadMinutes;
  }
  if (req.body.smsTransitIntervalMinutes !== undefined) {
    input.smsTransitIntervalMinutes = req.body.smsTransitIntervalMinutes;
  }
  if (req.body.smsPostPickupEscalationMinutes !== undefined) {
    input.smsPostPickupEscalationMinutes = req.body.smsPostPickupEscalationMinutes;
  }
  if (req.body.smsCooldownMinutes !== undefined) {
    input.smsCooldownMinutes = req.body.smsCooldownMinutes;
  }
  if (req.body.headquartersLatitude !== undefined) {
    input.headquartersLatitude = req.body.headquartersLatitude;
  }
  if (req.body.headquartersLongitude !== undefined) {
    input.headquartersLongitude = req.body.headquartersLongitude;
  }

  return input;
};
