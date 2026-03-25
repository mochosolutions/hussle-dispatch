export interface Tenant {
  id: string;
  name: string;
  
  // Add other fields as needed based on API response
}


export enum TenantStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export enum SubscriptionTier {
  TRIAL = 'TRIAL',
  LAUNCH = 'LAUNCH',
  PRO = 'PRO',
  ELITE = 'ELITE',
}
