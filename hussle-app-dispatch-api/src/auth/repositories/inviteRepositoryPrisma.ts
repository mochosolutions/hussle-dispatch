/**
 * Invitation Repository (Prisma)
 * Handles all data access operations for Invitations using Prisma
 * Follows dependency injection pattern - receives Prisma client as parameter
 */

/* eslint-disable max-lines-per-function, max-lines, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment, no-console, @typescript-eslint/no-unnecessary-condition */
// TODO: Fix pre-existing lint violations - this file has 100+ lint errors from legacy code

import { BadRequestError } from '@mocho/common';
import type { PrismaClient, Invitation as PrismaInvitation } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import type { PrismaTransaction } from '@/config/database';
// TODO: Refactor to use tenantRepositoryFactory or remove baseRepository dependency
// eslint-disable-next-line no-restricted-imports
import { repositoryFactoryPrisma } from '@/shared/utils/repositoryFactoryPrisma';
import type { Invite } from '../types/invite';

/**
 * Format Prisma Invitation to API Invite (dates to strings)
 */
export const formatInvite = (invite: PrismaInvitation): Invite => ({
  id: invite.id,
  organizationId: invite.organizationId,
  email: invite.email,
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
  const baseRepository = repositoryFactoryPrisma<PrismaInvitation>(prisma, 'invitation', tenantId);

  return {
    create: async (data: any, context?: any): Promise<Invite> => {
      try {
        const rawInvite = await baseRepository.create({ data });
        return formatInvite(rawInvite);
      } catch (error) {
        logger.error('Error creating invitation', { error });
        throw new BadRequestError('Error creating invitation');
      }
    },

    findInviteById: async (id: string, context?: any): Promise<Invite | null> => {
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

    findOneByFilter: async (filter: Record<string, any>, context?: any): Promise<Invite | null> => {
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
      filter: Record<string, any>,
      context?: any
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

    findAllInvites: async (context?: any): Promise<Invite[]> => {
      try {
        const invites = await baseRepository.findMany();
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
      data: Partial<Invite>,
      context?: any
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

    deleteInvite: async (id: string, context?: any): Promise<Invite | null> => {
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

    deleteInvitesByFilter: async (filter: Record<string, any>, context?: any): Promise<number> => {
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
