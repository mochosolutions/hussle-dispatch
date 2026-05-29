export const SUBSCRIPTION_LIMITS = Object.freeze({
  maxUsers: 10,
  maxVehicles: 3,
} as const);

export type SubscriptionLimits = typeof SUBSCRIPTION_LIMITS;
