import type { DriverInviteToken } from '@prisma/client';

export interface CreateDriverInviteTokenInput {
  driverId: string;
  organizationId: string;
  token: string;
  expiresAt: Date;
}

export interface DriverInviteTokenRepoPort {
  create(input: CreateDriverInviteTokenInput): Promise<DriverInviteToken>;
  findByToken(token: string): Promise<DriverInviteToken | null>;
  markAccepted(id: string, acceptedAt: Date): Promise<void>;
}

/**
 * Minimal driver projection the auth flows need: contact methods (to validate
 * invitability), the owning carrier's managing org (membership target), and the
 * existing user link (to resolve a driver session and prevent double-accept).
 */
export interface DriverAuthInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  userId: string | null;
  managedByOrgId: string;
}

export interface DriverAuthRepoPort {
  findDriverAuthInfo(driverId: string): Promise<DriverAuthInfo | null>;
  findDriverIdByUserId(userId: string): Promise<string | null>;
  linkUser(driverId: string, userId: string): Promise<void>;
}
