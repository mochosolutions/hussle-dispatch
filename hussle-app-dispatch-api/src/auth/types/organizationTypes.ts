import type { JsonValue } from '@prisma/client/runtime/library';
import type {
  Organization as PrismaOrganization,
  Membership as PrismaMembership,
  OrganizationVertical,
  OrganizationRole,
  OrganizationStatus,
  SubscriptionTier,
} from '@prisma/client';

/**
 * Organization type (derived from Prisma)
 * Prisma returns dates as Date objects, but API serializes to strings
 */
export type Organization = Omit<PrismaOrganization, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
};

/**
 * Membership type (derived from Prisma)
 * Extended with organization details for API responses
 */

/**
 * Membership type with populated User data
 * Used when fetching memberships with user information
 */
// export interface MembershipWithUser {
//   id: string;
//   userId: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   organizationId: string;
//   externalId: string;
//   role: string;
//   status: string;
//   createdAt: string;
//   updatedAt: string;
// }

/**
 * Resources structure for organization AWS resources
 * Stored as JSON in PostgreSQL
 */
export interface OrganizationResources {
  userPoolId?: string;
  appClientId?: string;
  apiGatewayUrl?: string;
}

/**
 * Input for organization signup (creates user + organization + membership)
 */
export interface SignupOrganizationInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  orgName: string;
  orgRole: string;
  orgVertical: string;
  customMetadata?: Record<string, any>;
}

/**
 * Result of organization signup
 */
export interface SignupOrganizationResult {
  userId: string;
  organizationId: string;
  membershipId: string;
}

/**
 * Input for creating a new organization
 */
export interface CreateOrganizationInput {
  name: string;
  slug: string; // URL-safe identifier for public routes
  email: string;
  role: string;
  vertical: string;
  subscriptionTier?: string;
  status?: string;
  customFields?: Record<string, any> | JsonValue;
  website?: string;
  description?: string;
  logo?: string;
  phoneNumber?: string;
  address?: string;
  resources?: OrganizationResources | JsonValue;
}

// ============================================================================
// Service Dependency Interfaces
// ============================================================================

export interface CreateOrganizationServiceDeps {
  create: (data: CreateOrganizationInput, options?: { context?: any }) => Promise<Organization>;
  findByName: (name: string, context?: any) => Promise<Organization | null>;
}

export interface DeleteOrganizationArgs {
  organizationId: string;
}

export interface DeleteOrganizationServiceDeps {
  findOrganizationById: Function;
  deleteOrganization: (id: string, context?: any) => Promise<Organization | null>;
}

// Re-export Prisma enums for convenience
export type { OrganizationVertical, OrganizationRole, OrganizationStatus, SubscriptionTier };
