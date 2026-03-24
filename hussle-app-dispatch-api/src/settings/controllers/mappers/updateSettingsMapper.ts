import type { Request } from 'express';
import type { UpdateSettingsInput } from '../../types/settingsTypes';
import { UnauthorizedError } from '@/shared/errors';

export const updateSettingsMapper = (req: Request): UpdateSettingsInput => {
  const organizationId = req.organizationId;

  if (organizationId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const input: UpdateSettingsInput = { organizationId };

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

  return input;
};
