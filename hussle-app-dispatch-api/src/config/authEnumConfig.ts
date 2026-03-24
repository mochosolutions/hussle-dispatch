import type { AuthEnumConfig } from '../auth/types/authEnumConfig';

/**
 * Project-specific enum configuration for the auth module.
 * These values define the allowed options for organization enums
 * and are injected via dependency injection into validators and repositories.
 */
export const AUTH_ENUM_CONFIG: AuthEnumConfig = {
  subscriptionTier: {
    values: ['TRIAL', 'LAUNCH', 'PRO', 'ELITE'],
    default: 'TRIAL',
  },
  organizationRole: {
    values: ['BROKER', 'CARRIER', 'DISPATCH_COMPANY', 'SHIPPER'],
    default: 'CARRIER',
  },
  organizationVertical: {
    values: ['logistics', 'healthcare', 'staffing'],
  },
};
