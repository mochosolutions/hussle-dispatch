import { logger } from '@/shared/utils/logger';
import { SequenceError } from '@/shared/errors';
import type {
  Membership,
  GetUserMembershipServiceDeps,
  MembershipServiceDeps,
} from '../../types/membershipTypes';

export const getUsersMembershipService = async (
  id: string,
  { findByUserId }: GetUserMembershipServiceDeps,
): Promise<Membership | null> => {
  try {
    return await findByUserId(id);
  } catch (error) {
    logger.error('Error fetching membership by ID', { userId: id, error });
    const serviceError = new SequenceError(`Failed to fetch membership with ID ${id}`);
    serviceError.cause = error;
    throw serviceError;
  }
};

export const getMembershipService = async (
  { findAllMemberships }: MembershipServiceDeps,
): Promise<Membership[]> => {
  try {
    return await findAllMemberships();
  } catch (error) {
    logger.error('Error fetching memberships', { error });
    const serviceError = new SequenceError(`Failed to fetch memberships`);
    serviceError.cause = error;
    throw serviceError;
  }
};
