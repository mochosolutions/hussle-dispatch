import type { OrgSettings } from '@prisma/client';

export interface ResolvedSmsSettings {
  prePickupLeadMinutes: number;
  transitIntervalMinutes: number;
  postPickupEscalationMinutes: number;
  cooldownMinutes: number;
}

const DEFAULT_SMS_SETTINGS: ResolvedSmsSettings = {
  prePickupLeadMinutes: 60,
  transitIntervalMinutes: 180,
  postPickupEscalationMinutes: 30,
  cooldownMinutes: 15,
};

/**
 * Returns SMS-prompt settings for an organization. Prisma column defaults only
 * apply on INSERT, so when a settings row does not exist yet we must fall back
 * to in-code defaults.
 */
export const resolveSmsSettings = (
  row: OrgSettings | null,
): ResolvedSmsSettings => {
  if (row === null) {
    return { ...DEFAULT_SMS_SETTINGS };
  }

  return {
    prePickupLeadMinutes: row.smsPrePickupLeadMinutes,
    transitIntervalMinutes: row.smsTransitIntervalMinutes,
    postPickupEscalationMinutes: row.smsPostPickupEscalationMinutes,
    cooldownMinutes: row.smsCooldownMinutes,
  };
};
