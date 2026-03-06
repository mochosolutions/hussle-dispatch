import { logger } from '@/shared/utils/logger';
import { SequenceError } from '@/shared/errors';
import type {
  Membership,
  UpdateManyMembershipsDeps,
  UpdateManyMembershipArgs,
} from '../../types/membershipTypes';

export const updateManyMembershipsService = async (
  { filter, data }: UpdateManyMembershipArgs,
  { updateManyMembership }: UpdateManyMembershipsDeps,
): Promise<Membership[] | null> => {
  try {
    logger.info('Updating memberships', { filter });
    const updatedMembership = await updateManyMembership(filter, data);
    logger.info('Updated memberships', { count: updatedMembership?.length ?? 0 });
    if (!updatedMembership) {
      return null;
    }
    return updatedMembership;
  } catch (error) {
    logger.error('Error updating memberships', { error });
    const serviceError = new SequenceError('Failed to update memberships(s)');
    serviceError.cause = error;
    throw serviceError;
  }
};
