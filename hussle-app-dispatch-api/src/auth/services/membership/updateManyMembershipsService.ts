import { logger } from '@/shared/utils/logger';
import type {
  Membership,
  UpdateManyMembershipsDeps,
  UpdateManyMembershipArgs,
} from '../../types/membershipTypes';

export const updateManyMembershipsService = async (
  { filter, data }: UpdateManyMembershipArgs,
  { updateManyMembership }: UpdateManyMembershipsDeps,
  context?: any
): Promise<Membership[] | null> => {
  try {
    logger.info('Updating memberships', { filter });
    const updatedMembership = await updateManyMembership(filter, data, context);
    logger.info('Updated memberships', { count: updatedMembership?.length ?? 0 });
    if (!updatedMembership) {
      return null;
    }
    return updatedMembership;
  } catch (error) {
    logger.error('Error updating memberships', { error });
    throw Error('Failed to update memberships(s)');
  }
};
