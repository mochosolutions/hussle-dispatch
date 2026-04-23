import * as Yup from 'yup';
import type { InferType } from 'yup';

export const settingsSchema = Yup.object({
  defaultTonuFee: Yup.number()
    .required('TONU fee is required')
    .min(0, 'Must be 0 or greater')
    .max(10000, 'Must be 10,000 or less'),
  prohibitedCommodities: Yup.array()
    .of(Yup.string().required().trim())
    .default([]),
  weeklyGrossTarget: Yup.number()
    .required('Weekly gross target is required')
    .min(0, 'Must be 0 or greater')
    .max(1000000, 'Must be 1,000,000 or less'),
  defaultDetentionRate: Yup.number()
    .required('Detention rate is required')
    .min(0, 'Must be 0 or greater')
    .max(1000, 'Must be 1,000 or less'),
  detentionFreeHours: Yup.number()
    .required('Detention free hours is required')
    .integer('Must be a whole number')
    .min(0, 'Must be 0 or greater')
    .max(72, 'Must be 72 or less'),
  minBookRateProfitMargin: Yup.number()
    .required('Minimum profit margin is required')
    .min(0, 'Must be 0% or greater')
    .max(100, 'Must be 100% or less'),
  defaultMaxDaysOut: Yup.number()
    .required('Max days out is required')
    .integer('Must be a whole number')
    .min(1, 'Must be at least 1')
    .max(30, 'Must be 30 or less'),
  chainDepthThresholdMiles: Yup.number()
    .required('Chain depth threshold is required')
    .integer('Must be a whole number')
    .min(1, 'Must be at least 1')
    .max(5000, 'Must be 5,000 or less'),
  backhaulSearchRadiusMiles: Yup.number()
    .required('Backhaul search radius is required')
    .integer('Must be a whole number')
    .min(1, 'Must be at least 1')
    .max(500, 'Must be 500 or less'),
  autoScrapingEnabled: Yup.boolean().required().default(true),
  loadIntelEmailAddress: Yup.string()
    .email('Must be a valid email')
    .default(''),
  sesFromEmail: Yup.string()
    .email('Must be a valid email')
    .default(''),
  companyLogoUrl: Yup.string()
    .url('Must be a valid URL')
    .default(''),
  smsPrePickupLeadMinutes: Yup.number()
    .required('Pre-pickup lead time is required')
    .integer('Must be a whole number')
    .min(1, 'Must be at least 1 minute')
    .max(1440, 'Must be 1,440 minutes (24 hours) or less'),
  smsTransitIntervalMinutes: Yup.number()
    .required('Transit check-in interval is required')
    .integer('Must be a whole number')
    .min(1, 'Must be at least 1 minute')
    .max(1440, 'Must be 1,440 minutes (24 hours) or less'),
  smsPostPickupEscalationMinutes: Yup.number()
    .required('Post-pickup escalation is required')
    .integer('Must be a whole number')
    .min(1, 'Must be at least 1 minute')
    .max(1440, 'Must be 1,440 minutes (24 hours) or less'),
  smsCooldownMinutes: Yup.number()
    .required('Cooldown is required')
    .integer('Must be a whole number')
    .min(1, 'Must be at least 1 minute')
    .max(1440, 'Must be 1,440 minutes (24 hours) or less'),
}).required();

export type SettingsSchemaValues = InferType<typeof settingsSchema>;
