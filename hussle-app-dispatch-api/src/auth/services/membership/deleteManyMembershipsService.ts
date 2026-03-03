import { logger } from '@/shared/utils/logger';
import type {
  Membership,
  DeleteManyMembershipArgs,
  DeleteManyMembershipsDeps,
} from '../../types/membershipTypes';

export const deleteManyMembershipsService = async (
  { ids }: DeleteManyMembershipArgs,
  { deleteManyMemberships }: DeleteManyMembershipsDeps,
  context?: any
): Promise<Membership[] | null> => {
  try {
    logger.info('Deleting memberships', { count: ids.length });
    const updatedMembership = await deleteManyMemberships(ids, context);
    logger.info('Deleted memberships', { count: updatedMembership?.length ?? 0 });
    if (!updatedMembership) {
      return null;
    }
    return updatedMembership;
  } catch (error) {
    logger.error('Error deleting memberships', { error });
    throw Error('Failed to deleting memberships(s)');
  }
};
