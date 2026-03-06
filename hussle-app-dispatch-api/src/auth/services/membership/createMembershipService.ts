import { logger } from '@/shared/utils/logger';
import { ConflictError, SequenceError, isCustomError } from '@/shared/errors';
import type {
  CreateMembershipInput,
  Membership,
  CreateMembershipServiceDeps,
} from '../../types/membershipTypes';

export const createMembershipService = async (
  data: CreateMembershipInput,
  { create, findOneByFilter }: CreateMembershipServiceDeps,
): Promise<Membership> => {
  try {
    const exists = await findOneByFilter(
      { userId: data.userId, organizationId: data.organizationId },
    );
    if (exists) {
      throw new ConflictError(`Membership already exists for user ${data.userId}`);
    }
    return await create(data);
  } catch (error) {
    if (isCustomError(error)) {
      throw error;
    }
    logger.error('Error creating membership', { error });
    const serviceError = new SequenceError(`Failed to create membership`);
    serviceError.cause = error;
    throw serviceError;
  }
};
