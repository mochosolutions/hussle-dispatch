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
  Free = 'free',
  Pro = 'pro',
  Enterprise = 'enterprise',
}
