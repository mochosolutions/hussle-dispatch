export interface AuthEnumValueConfig {
  values: readonly string[];
  default?: string;
}

export interface AuthEnumConfig {
  subscriptionTier: AuthEnumValueConfig;
  organizationRole: AuthEnumValueConfig;
  organizationVertical: AuthEnumValueConfig;
}
