export enum OrganizationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum OrganizationVertical {
  LOGISTICS = 'logistics',
  HEALTHCARE = 'healthcare',
  STAFFING = 'staffing',
}

export enum OrganizationRole {
  BROKER = 'broker',
  CARRIER = 'carrier',
  SHIPPER = 'shipper',
}

export enum MembershipRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DISPATCHER = 'dispatcher',
  DRIVER = 'driver',
}

export enum InvitationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Expired = 'expired',
  Revoked = 'revoked',
}
