/**
 * Market tier definitions used by load intelligence scoring.
 * Tiers rank a destination market's strength for outbound load availability.
 */
export const MARKET_TIERS = Object.freeze({
  STRONG: 'STRONG',
  MODERATE: 'MODERATE',
  WEAK: 'WEAK',
  UNKNOWN: 'UNKNOWN',
} as const);

export type MarketTier = (typeof MARKET_TIERS)[keyof typeof MARKET_TIERS];
