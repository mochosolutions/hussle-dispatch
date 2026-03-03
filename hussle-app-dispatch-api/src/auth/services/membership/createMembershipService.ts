import { logger } from '@/shared/utils/logger';
import type {
  CreateMembershipInput,
  Membership,
  CreateMembershipServiceDeps,
} from '../../types/membershipTypes';

export const createMembershipService = async (
  data: CreateMembershipInput,
  { create, findOneByFilter }: CreateMembershipServiceDeps,
  context?: any
): Promise<Membership> => {
  try {
    const exists = await findOneByFilter(
      { userId: data.userId, organizationId: data.organizationId },
      context
    );
    if (exists) {
      throw new Error(`Membership already exists for user ${data.userId}`);
    }
    return await create(data, context);
  } catch (error) {
    logger.error('Error creating membership', { error });
    throw new Error(`Failed to create membership`);
  }
};
