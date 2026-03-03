import type { Invitation as PrismaInvitation, InvitationStatus } from '@prisma/client';

/**
 * Invite type (derived from Prisma Invitation model)
 * Prisma returns dates as Date objects, but API serializes to strings
 * Note: Using "Invite" for backward compatibility (Prisma model is "Invitation")
 */
export type Invite = Omit<
  PrismaInvitation,
  'createdAt' | 'updatedAt' | 'expiresAt' | 'invitedById'
> & {
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  invitedBy: string; // Changed from invitedById for API compatibility
};

/**
 * Input for creating a new invitation
 */
export interface CreateInviteInput {
  organizationId: string;
  email: string;
  role: string;
  token: string;
  status?: InvitationStatus;
  invitedById: string;
  expiresAt: Date;
}

/**
 * Input for updating an invitation
 */
export interface UpdateInviteInput {
  status?: InvitationStatus;
}

// Re-export Prisma enum for convenience
export type { InvitationStatus };
