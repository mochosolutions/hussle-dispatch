export const SUBSCRIPTION_LIMITS = Object.freeze({
  maxUsers: 3,
  maxVehicles: 3,
} as const);

export type SubscriptionLimits = typeof SUBSCRIPTION_LIMITS;
