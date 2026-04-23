import * as Yup from 'yup';

const updateSettingsBodySchema = Yup.object({
  defaultTonuFee: Yup.number()
    .positive('defaultTonuFee must be positive')
    .max(99999999.99, 'defaultTonuFee must be at most 99999999.99')
    .notRequired(),
  prohibitedCommodities: Yup.array()
    .of(Yup.string().trim().max(255, 'each prohibited commodity must be at most 255 characters'))
    .notRequired(),
  weeklyGrossTarget: Yup.number()
    .positive('weeklyGrossTarget must be positive')
    .max(99999999.99, 'weeklyGrossTarget must be at most 99999999.99')
    .notRequired(),
  defaultDetentionRate: Yup.number()
    .positive('defaultDetentionRate must be positive')
    .max(99999999.99, 'defaultDetentionRate must be at most 99999999.99')
    .notRequired(),
  detentionFreeHours: Yup.number()
    .integer('detentionFreeHours must be an integer')
    .min(0, 'detentionFreeHours must be at least 0')
    .max(168, 'detentionFreeHours must be at most 168')
    .notRequired(),
  minBookRateProfitMargin: Yup.number()
    .min(0, 'minBookRateProfitMargin must be at least 0')
    .max(100, 'minBookRateProfitMargin must be at most 100')
    .notRequired(),
  defaultMaxDaysOut: Yup.number()
    .integer('defaultMaxDaysOut must be an integer')
    .positive('defaultMaxDaysOut must be positive')
    .max(365, 'defaultMaxDaysOut must be at most 365')
    .notRequired(),
  chainDepthThresholdMiles: Yup.number()
    .integer('chainDepthThresholdMiles must be an integer')
    .positive('chainDepthThresholdMiles must be positive')
    .max(10000, 'chainDepthThresholdMiles must be at most 10000')
    .notRequired(),
  backhaulSearchRadiusMiles: Yup.number()
    .integer('backhaulSearchRadiusMiles must be an integer')
    .positive('backhaulSearchRadiusMiles must be positive')
    .max(1000, 'backhaulSearchRadiusMiles must be at most 1000')
    .notRequired(),
  autoScrapingEnabled: Yup.boolean().notRequired(),
  loadIntelEmailAddress: Yup.string()
    .trim()
    .email('loadIntelEmailAddress must be a valid email')
    .max(255, 'loadIntelEmailAddress must be at most 255 characters')
    .notRequired(),
  sesFromEmail: Yup.string()
    .trim()
    .email('sesFromEmail must be a valid email')
    .max(255, 'sesFromEmail must be at most 255 characters')
    .notRequired(),
  companyLogoUrl: Yup.string()
    .trim()
    .url('companyLogoUrl must be a valid URL')
    .max(2048, 'companyLogoUrl must be at most 2048 characters')
    .notRequired(),
  smsPrePickupLeadMinutes: Yup.number()
    .integer('smsPrePickupLeadMinutes must be an integer')
    .min(1, 'smsPrePickupLeadMinutes must be at least 1')
    .max(1440, 'smsPrePickupLeadMinutes must be at most 1440')
    .notRequired(),
  smsTransitIntervalMinutes: Yup.number()
    .integer('smsTransitIntervalMinutes must be an integer')
    .min(1, 'smsTransitIntervalMinutes must be at least 1')
    .max(1440, 'smsTransitIntervalMinutes must be at most 1440')
    .notRequired(),
  smsPostPickupEscalationMinutes: Yup.number()
    .integer('smsPostPickupEscalationMinutes must be an integer')
    .min(1, 'smsPostPickupEscalationMinutes must be at least 1')
    .max(1440, 'smsPostPickupEscalationMinutes must be at most 1440')
    .notRequired(),
  smsCooldownMinutes: Yup.number()
    .integer('smsCooldownMinutes must be an integer')
    .min(1, 'smsCooldownMinutes must be at least 1')
    .max(1440, 'smsCooldownMinutes must be at most 1440')
    .notRequired(),
}).test('has-any-field', 'At least one field must be provided', (value) => {
  if (value === undefined) {
    return false;
  }
  return Object.keys(value).length > 0;
});

export const updateSettingsSchema = Yup.object({
  body: updateSettingsBodySchema,
});

export const getSettingsSchema = Yup.object({});
