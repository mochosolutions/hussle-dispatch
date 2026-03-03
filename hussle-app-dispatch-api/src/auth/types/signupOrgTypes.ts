export interface SignupOrgResult {
  // token: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
    role: string;
  };
  tenant: {
    tenantId: string;
    name: string;
    slug: string;
    status: string;
    subscriptionTier: string;
    membershipId: string;
  };
  // userId: string;
  // orgId: string;
  // userRole: string;
  // orgRole: string;
  // subscriptionTier: string;
}

export interface SignupOrgInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  orgName: string;
  orgRole?: string;
  orgVertical?: string;
  customMetadata?: Record<string, any>;
}

export interface SignupOrganizationResult {
  organizationId: string;
  userId: string;
  membershipId: string;
  token: string;
}
