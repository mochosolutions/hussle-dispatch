import { logger } from '@/shared/utils/logger';
import type {
  Membership,
  UpdateMembershipServiceDeps,
  UpdateMembershipInput,
} from '../../types/membershipTypes';

export const updateMembershipService = async (
  id: string,
  data: UpdateMembershipInput,
  { updateMembership }: UpdateMembershipServiceDeps,
  context?: any
): Promise<Membership | null> => {
  try {
    return await updateMembership(id, data, context);
  } catch (error) {
    logger.error('Error updating membership', { membershipId: id, error });
    throw Error(`Failed to update membership with ID ${id}`);
  }
};
