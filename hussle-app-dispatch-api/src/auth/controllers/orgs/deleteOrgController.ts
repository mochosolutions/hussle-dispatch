import type { Request, Response } from 'express';
import { redisClient as redis } from '@/shared/redisClient';
import { PrismaTransactionManager, type PrismaTransaction } from '@/shared/prisma';
import { getClientId } from '@/shared/utils/cognito';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import { cognitoProvider } from '../../providers/authProvider';
import { tokenProvider } from '../../providers/tokenProvider';
import { inviteRepositoryPrisma } from '../../repositories/inviteRepositoryPrisma';
import { membershipRepositoryPrisma } from '../../repositories/membershipRepositoryPrisma';
import { organizationRepositoryPrisma } from '../../repositories/organizationRepositoryPrisma';
import { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';
import {
  deleteOrganizationService,
  deleteOrganizationUseCase,
  getMembershipService,
  updateManyUsersService,
  deleteManyMembershipsService,
} from '../../services';

export const deleteOrganizationController = async (req: Request, res: Response) => {
  const organizationId = req.params['organizationId'];
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  const { clientId, userPoolId } = await getClientId();

  const authProvider = cognitoProvider({
    client: cognitoIdentityClient,
    userPoolId,
    clientId,
  });
  const tokenProviderInstance = tokenProvider({ client: redis });
  const transactionManager = new PrismaTransactionManager();

  const result = await deleteOrganizationUseCase(
    { organizationId },
    {
      transactionManager,
      tokenProvider: tokenProviderInstance,
      authProvider,
      deleteOrgService: (data: any, tx: PrismaTransaction) => {
        const orgRepo = organizationRepositoryPrisma(tx);
        return deleteOrganizationService(data, {
          deleteOrganization: orgRepo.deleteOrganization,
          findOrganizationById: orgRepo.findOrganizationById,
        });
      },
      getMembershipService: (tx: PrismaTransaction) => {
        const membershipRepo = membershipRepositoryPrisma(tx, organizationId);
        return getMembershipService({
          findAllMemberships: membershipRepo.findMembershipByOrg,
        });
      },
      updateManyUsersService: (filter: any, data: any, tx: PrismaTransaction) => {
        const userRepo = userRepositoryPrisma(tx);
        return updateManyUsersService(
          { filter, data },
          { updateManyUsers: userRepo.updateManyUsers }
        );
      },
      deleteManyMembershipService: ({ ids }: { ids: string[] }, tx: PrismaTransaction) => {
        const membershipRepo = membershipRepositoryPrisma(tx, organizationId);
        return deleteManyMembershipsService(
          { ids },
          { deleteManyMemberships: membershipRepo.deleteManyMemberships }
        );
      },
      deleteInvitationsByFilter: async (filter: Record<string, any>, tx: PrismaTransaction) => {
        const inviteRepo = inviteRepositoryPrisma(tx);
        return inviteRepo.deleteInvitesByFilter(filter);
      },
      getUserActiveMembershipsCount: async (userId: string, tx: PrismaTransaction) => {
        const membershipRepo = membershipRepositoryPrisma(tx);
        return membershipRepo.getActiveMembershipsCount(userId);
      },
    }
  );

  return res.status(200).json({
    message: 'Organization deleted successfully',
    ...result,
  });
};
