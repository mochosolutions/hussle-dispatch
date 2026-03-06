import { logger } from '@/shared/utils/logger';
import { SequenceError } from '@/shared/errors';
import type {
  Membership,
  DeleteManyMembershipArgs,
  DeleteManyMembershipsDeps,
} from '../../types/membershipTypes';

export const deleteManyMembershipsService = async (
  { ids }: DeleteManyMembershipArgs,
  { deleteManyMemberships }: DeleteManyMembershipsDeps,
): Promise<Membership[] | null> => {
  try {
    logger.info('Deleting memberships', { count: ids.length });
    const updatedMembership = await deleteManyMemberships(ids);
    logger.info('Deleted memberships', { count: updatedMembership?.length ?? 0 });
    if (!updatedMembership) {
      return null;
    }
    return updatedMembership;
  } catch (error) {
    logger.error('Error deleting memberships', { error });
    const serviceError = new SequenceError('Failed to deleting memberships(s)');
    serviceError.cause = error;
    throw serviceError;
  }
};
