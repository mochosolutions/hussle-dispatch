import { logger } from '@/shared/utils/logger';
import type {
  Membership,
  GetUserMembershipServiceDeps,
  MembershipServiceDeps,
} from '../../types/membershipTypes';

export const getUsersMembershipService = async (
  id: string,
  { findByUserId }: GetUserMembershipServiceDeps,
  context?: any
): Promise<Membership | null> => {
  try {
    return await findByUserId(id, context);
  } catch (error) {
    logger.error('Error fetching membership by ID', { userId: id, error });
    throw new Error(`Failed to fetch membership with ID ${id}`);
  }
};

export const getMembershipService = async (
  { findAllMemberships }: MembershipServiceDeps,
  context?: any
): Promise<Membership[]> => {
  try {
    return await findAllMemberships(context);
  } catch (error) {
    logger.error('Error fetching memberships', { error });
    throw new Error(`Failed to fetch memberships`);
  }
};
