import { BadRequestError } from '@mocho/common';
import type { ITokenProvider } from '../../types/tokenProvider';
import { logger } from '@/shared/utils/logger';
import type { PrismaTransaction } from '@/shared/prisma';
import type { IAuthProvider } from '../../types/authProviderTypes';
import type { Membership, DeleteManyMembershipArgs } from '../../types/membershipTypes';
import type { Organization, DeleteOrganizationArgs } from '../../types/organizationTypes';
import type { User, UpdateUserInput } from '../../types/user';

export interface DeleteOrganizationUseCaseDeps {
  transactionManager: {
    runInTransaction: <T>(fn: (tx: PrismaTransaction) => Promise<T>) => Promise<T>;
  };
  tokenProvider: ITokenProvider;
  authProvider: IAuthProvider;

  getMembershipService: (tx: PrismaTransaction) => Promise<Membership[]>;
  deleteOrgService: (
    data: DeleteOrganizationArgs,
    tx: PrismaTransaction
  ) => Promise<Organization | null>;
  updateManyUsersService: (
    filter: any,
    data: UpdateUserInput,
    tx: PrismaTransaction
  ) => Promise<User[] | null>;
  deleteManyMembershipService: (
    filter: DeleteManyMembershipArgs,
    tx: PrismaTransaction
  ) => Promise<any[] | null>;
  deleteInvitationsByFilter: (
    filter: Record<string, any>,
    tx: PrismaTransaction
  ) => Promise<number>;
  getUserActiveMembershipsCount: (userId: string, tx: PrismaTransaction) => Promise<number>;
}

export interface DeleteOrgInput {
  organizationId: string;
}

// ✅ Implemented: Soft delete for organization
// ✅ Implemented: Soft delete for memberships
// ✅ Implemented: Revoke sessions for users in the organization
// ✅ Implemented: Orphaned user detection and Cognito cleanup
// Note: Database users are NOT deleted (they may belong to other orgs)
// Note: Cognito users ARE deleted if they have no remaining active memberships

export const deleteOrganizationUseCase = async (
  { organizationId }: DeleteOrgInput,
  {
    transactionManager,
    tokenProvider,
    authProvider,
    getMembershipService,
    updateManyUsersService,
    deleteOrgService,
    deleteManyMembershipService,
    deleteInvitationsByFilter,
    getUserActiveMembershipsCount,
  }: DeleteOrganizationUseCaseDeps
) => {
  const orphanedCognitoUsers: string[] = [];

  try {
    return await transactionManager.runInTransaction(async (tx) => {
      if (!organizationId) {
        throw new BadRequestError('Something went wrong organzationId is not defined ');
      }

      logger.info('Starting organization deletion process', { organizationId });

      // Parallel queries where possible
      const [deletedOrg, memberships] = await Promise.all([
        deleteOrgService({ organizationId }, tx),
        getMembershipService(tx), // Gets memberships for this organization only (filtered by tenantId in repository)
      ]);

      logger.info('Organization deleted', { organizationId, deleted: !!deletedOrg });
      logger.info('Memberships found for deletion', { organizationId, count: memberships?.length ?? 0 });

      const membershipIds = memberships?.map((membership) => membership?.membershipId) || [];

      logger.info('Memberships to delete', { count: membershipIds.length });

      // Parallel cleanup operations
      const cleanupPromises: Promise<any>[] = [];

      // 1. Delete all memberships for this organization
      if (membershipIds.length > 0) {
        cleanupPromises.push(deleteManyMembershipService({ ids: membershipIds }, tx));
      }

      // 2. Delete all invitations for this organization
      const invitationCleanup = async () => {
        const count = await deleteInvitationsByFilter({ organizationId }, tx);
        logger.info('Deleted invitations for organization', { organizationId, count });
        return count;
      };
      cleanupPromises.push(invitationCleanup());

      // 3. Handle session cleanup with error handling (don't fail transaction)
      const sessionCleanup = async () => {
        try {
          const sessions = await tokenProvider.getOrgSessions(organizationId);
          logger.info('Org sessions found', { organizationId, count: sessions.length });
          await tokenProvider.deleteOrgSessions({ sessions });
          return sessions.length;
        } catch (error) {
          // Log error but don't fail the transaction
          // Sessions can be cleaned up later by a background job if needed
          logger.error('Failed to cleanup sessions for org, continuing with transaction', {
            organizationId,
            error,
          });
          return null;
        }
      };
      cleanupPromises.push(sessionCleanup());

      // Wait for all cleanup operations to complete
      const [deletedMemberships, deletedInvitationsCount] = await Promise.all(cleanupPromises);

      logger.info('Cleanup results', {
        deletedMembershipsCount: membershipIds.length,
        deletedInvitationsCount,
      });

      // 4. Detect orphaned users (users with no remaining active memberships)
      const userIds = memberships?.map((m) => m.userId).filter(Boolean) || [];
      const orphanedUsers: Array<{ userId: string; externalId: string }> = [];

      for (const userId of userIds) {
        const activeMembershipsCount = await getUserActiveMembershipsCount(userId, tx);
        if (activeMembershipsCount === 0) {
          const membership = memberships.find((m) => m.userId === userId);
          if (membership?.externalId) {
            orphanedUsers.push({ userId, externalId: membership.externalId });
            orphanedCognitoUsers.push(membership.externalId);
          }
        }
      }

      logger.info('Orphaned users detected for Cognito cleanup', { count: orphanedUsers.length });

      return {
        success: true,
        organizationId,
        deletedMemberships: membershipIds.length,
        deletedInvitations: deletedInvitationsCount || 0,
        orphanedUsers: orphanedUsers.length,
      };
    });
  } catch (error) {
    logger.error('Error during organization deletion', { organizationId, error });
    throw error;
  } finally {
    // Clean up orphaned Cognito users outside transaction
    // This happens after transaction commits to avoid blocking the transaction
    if (orphanedCognitoUsers.length > 0) {
      logger.info('Cleaning up orphaned Cognito users', { count: orphanedCognitoUsers.length });
      for (const externalId of orphanedCognitoUsers) {
        try {
          await authProvider.deleteUser(externalId);
          logger.info('Successfully deleted Cognito user', { externalId });
        } catch (cleanupError) {
          // Log error but don't fail the operation - Cognito cleanup can be retried
          logger.error('Failed to delete Cognito user', { externalId, error: cleanupError });
        }
      }
    }
  }
};
