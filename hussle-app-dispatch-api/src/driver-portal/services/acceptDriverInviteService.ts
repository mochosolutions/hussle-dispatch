import { BadRequestError } from '@mocho/common';

import type { PrismaTransaction } from '@/shared/prisma';
import { GoneError, NotFoundError } from '@/shared/errors';
import { ROLES } from '@/config/roles';
import type { Logger } from '@/shared/utils/logger';

import type { DriverAuthInfo } from '../types/driverAuthTypes';

export interface AcceptDriverInviteInput {
  token: string;
  password: string;
  email?: string;
}

export interface AcceptDriverInviteResult {
  userId: string;
  organizationId: string;
  orgSlug: string;
  orgStatus: string;
  orgSubscriptionTier: string;
  membershipId: string;
  role: string;
  driverId: string;
}

interface DriverInviteTokenView {
  id: string;
  driverId: string;
  organizationId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  acceptedAt: Date | null;
}

interface OrgView {
  id: string;
  slug: string;
  status: string;
  subscriptionTier: string;
}

export interface AcceptDriverInviteServiceDeps {
  transactionManager: {
    runInTransaction: <T>(fn: (tx: PrismaTransaction) => Promise<T>) => Promise<T>;
  };
  findTokenByToken: (token: string, tx: PrismaTransaction) => Promise<DriverInviteTokenView | null>;
  findDriverAuthInfo: (driverId: string, tx: PrismaTransaction) => Promise<DriverAuthInfo | null>;
  findOrganizationById: (id: string, tx: PrismaTransaction) => Promise<OrgView | null>;
  authProvider: {
    createUser: (args: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      orgId: string;
      orgRole: string;
    }) => Promise<{ id: string }>;
    deleteUser: (id: string) => Promise<{ id: string }>;
  };
  createUser: (
    data: { email: string; firstName: string; lastName: string; externalId: string },
    tx: PrismaTransaction,
  ) => Promise<{ id: string }>;
  createMembership: (
    data: { userId: string; organizationId: string; role: string },
    tx: PrismaTransaction,
  ) => Promise<{ membershipId: string }>;
  linkDriverUser: (driverId: string, userId: string, tx: PrismaTransaction) => Promise<void>;
  markTokenAccepted: (id: string, acceptedAt: Date, tx: PrismaTransaction) => Promise<void>;
  logger: Logger;
}

/**
 * Accepts a driver setup invite. Validates the token (non-revoked, non-expired,
 * not already accepted), then provisions a Cognito user + DRIVER-role Membership
 * in the driver's managing org, links Driver.userId, and marks the token used —
 * all in one transaction. Returns the data the controller needs to issue the
 * standard access+refresh session. Cognito user is cleaned up on rollback.
 */
export const acceptDriverInviteService = async (
  input: AcceptDriverInviteInput,
  deps: AcceptDriverInviteServiceDeps,
): Promise<AcceptDriverInviteResult> => {
  let externalUserId: string | undefined;

  try {
    return await deps.transactionManager.runInTransaction(async (tx) => {
      const tokenRecord = await deps.findTokenByToken(input.token, tx);

      if (tokenRecord === null) {
        throw new BadRequestError('Invalid driver invite token.');
      }
      if (tokenRecord.revokedAt !== null) {
        throw new GoneError('Driver invite has been revoked.');
      }
      if (tokenRecord.acceptedAt !== null) {
        throw new GoneError('Driver invite has already been used.');
      }
      if (tokenRecord.expiresAt < new Date()) {
        throw new GoneError('Driver invite has expired.');
      }

      const driver = await deps.findDriverAuthInfo(tokenRecord.driverId, tx);
      if (driver === null) {
        throw new NotFoundError('Driver not found.');
      }
      if (driver.userId !== null) {
        throw new BadRequestError('Driver account already exists.');
      }

      const email = driver.email ?? input.email;
      if (email === undefined || email === null || email === '') {
        throw new BadRequestError('An email is required to create the driver account.');
      }

      const organization = await deps.findOrganizationById(tokenRecord.organizationId, tx);
      if (organization === null) {
        throw new NotFoundError('Organization not found.');
      }

      const externalUser = await deps.authProvider.createUser({
        email,
        password: input.password,
        firstName: driver.firstName,
        lastName: driver.lastName,
        orgId: organization.id,
        orgRole: ROLES.DRIVER,
      });
      externalUserId = externalUser.id;

      const user = await deps.createUser(
        { email, firstName: driver.firstName, lastName: driver.lastName, externalId: externalUser.id },
        tx,
      );

      const membership = await deps.createMembership(
        { userId: user.id, organizationId: organization.id, role: ROLES.DRIVER },
        tx,
      );

      await deps.linkDriverUser(driver.id, user.id, tx);
      await deps.markTokenAccepted(tokenRecord.id, new Date(), tx);

      deps.logger.info('Driver invite accepted', {
        driverId: driver.id,
        userId: user.id,
        organizationId: organization.id,
      });

      return {
        userId: user.id,
        organizationId: organization.id,
        orgSlug: organization.slug,
        orgStatus: organization.status,
        orgSubscriptionTier: organization.subscriptionTier,
        membershipId: membership.membershipId,
        role: ROLES.DRIVER,
        driverId: driver.id,
      };
    });
  } catch (error: unknown) {
    if (externalUserId !== undefined) {
      try {
        await deps.authProvider.deleteUser(externalUserId);
      } catch (cleanupError: unknown) {
        deps.logger.error('Error cleaning up driver external user', {
          externalUserId,
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        });
      }
    }
    throw error;
  }
};
