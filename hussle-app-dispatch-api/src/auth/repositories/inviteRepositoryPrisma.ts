/**
 * Invitation Repository (Prisma)
 * Handles all data access operations for Invitations using Prisma
 * Follows dependency injection pattern - receives Prisma client as parameter
 */

import { BadRequestError } from '@mocho/common';
import { InvitationStatus } from '@prisma/client';
import type { PrismaClient, Invitation as PrismaInvitation } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import type { PrismaTransaction } from '@/config/database';
// TODO: Refactor to use tenantRepositoryFactory or remove baseRepository dependency
import { repositoryFactoryPrisma } from '@/shared/utils/repositoryFactoryPrisma';
import type { Invite } from '../types/invite';

/**
 * Format Prisma Invitation to API Invite (dates to strings)
 */
export const formatInvite = (invite: PrismaInvitation): Invite => ({
  id: invite.id,
  organizationId: invite.organizationId,
  email: invite.email,
  firstName: invite.firstName,
  lastName: invite.lastName,
  role: invite.role,
  token: invite.token,
  status: invite.status,
  expiresAt: invite.expiresAt.toISOString(),
  invitedBy: invite.invitedById, // Rename to match API type
  createdAt: invite.createdAt.toISOString(),
  updatedAt: invite.updatedAt.toISOString(),
});

export const inviteRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
  tenantId?: string
) => {
  const baseRepository = repositoryFactoryPrisma<PrismaInvitation>({ prisma, modelName: 'invitation', tenantId });

  return {
    create: async (data: Record<string, unknown>): Promise<Invite> => {
      try {
        const rawInvite = await baseRepository.create({ data });
        return formatInvite(rawInvite);
      } catch (error) {
        logger.error('Error creating invitation', { error });
        throw new BadRequestError('Error creating invitation');
      }
    },

    findInviteById: async (id: string): Promise<Invite | null> => {
      try {
        const rawInvite = await baseRepository.findOne({ filter: { id } });
        if (!rawInvite) {
          return null;
        }
        return formatInvite(rawInvite);
      } catch (error) {
        logger.error('Error finding invitation by ID', { error });
        throw new BadRequestError('Error finding invitation');
      }
    },

    findOneByFilter: async (filter: Record<string, unknown>): Promise<Invite | null> => {
      try {
        const rawInvite = await baseRepository.findOne({ filter });
        if (!rawInvite) {
          return null;
        }
        return formatInvite(rawInvite);
      } catch (error) {
        logger.error('Error finding invitation by filter', { error });
        throw new BadRequestError('Error finding invitation');
      }
    },

    findInviteByFilter: async (
      filter: Record<string, unknown>
    ): Promise<Invite[] | null> => {
      try {
        const docs = await baseRepository.findMany({ filter });

        if (!docs || docs.length === 0) {
          return null;
        }

        return docs.map(formatInvite);
      } catch (error) {
        logger.error('Error finding invitation by filter', { error });
        throw new BadRequestError('Error finding invitation');
      }
    },

    findAllInvites: async (filter: Record<string, unknown> = {}): Promise<Invite[]> => {
      try {
        // Only surface actionable invites — PENDING and EXPIRED (which can still be
        // resent). Terminal states (ACCEPTED, REVOKED) are excluded so they never
        // appear in the "Pending Invitations" list as resend/revoke targets.
        const invites = await baseRepository.findMany({
          filter: {
            status: { notIn: [InvitationStatus.ACCEPTED, InvitationStatus.REVOKED] },
            ...filter,
          },
        });
        if (!invites || invites.length === 0) {
          logger.info('No invites found');
          return [];
        }
        return invites.map(formatInvite);
      } catch (error) {
        logger.error('Error listing invites', { error });
        throw new BadRequestError('Error listing invites');
      }
    },

    updateInvite: async (
      id: string,
      data: Partial<Invite>
    ): Promise<Invite | null> => {
      try {
        const updatedInvite = await baseRepository.update({ id, data });
        if (!updatedInvite) {
          return null;
        }
        return formatInvite(updatedInvite);
      } catch (error) {
        logger.error('Error updating invite', { error });
        throw new BadRequestError('Error updating invite');
      }
    },

    deleteInvite: async (id: string): Promise<Invite | null> => {
      try {
        const deletedInvite = await baseRepository.delete({ id });
        if (!deletedInvite) {
          return null;
        }
        return formatInvite(deletedInvite);
      } catch (error) {
        logger.error('Error deleting invite', { error });
        throw new BadRequestError('Error deleting invite');
      }
    },

    countPending: async (organizationId: string): Promise<number> => {
      try {
        const count = await prisma.invitation.count({
          where: {
            organizationId,
            status: 'PENDING',
            expiresAt: { gt: new Date() },
          },
        });
        return count;
      } catch (error: unknown) {
        logger.error('Error counting pending invitations', { error });
        throw new BadRequestError('Error counting pending invitations');
      }
    },

    deleteInvitesByFilter: async (filter: Record<string, unknown>): Promise<number> => {
      try {
        const deletedCount = await baseRepository.deleteMany({ filter });
        return deletedCount;
      } catch (error) {
        logger.error('Error deleting invites by filter', { error });
        throw new BadRequestError('Error deleting invites');
      }
    },
  };
};
