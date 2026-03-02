/**
 * Default prohibited commodities per company policy.
 * Configurable per org in OrgSettings.prohibitedCommodities.
 */
export const PROHIBITED_COMMODITIES_DEFAULT: readonly string[] = Object.freeze([
  'garbage',
  'refuse',
  'recyclables',
  'dirty recyclables',
] as const);
