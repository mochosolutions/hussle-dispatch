import { logger } from '@/shared/utils/logger';
import { SequenceError } from '@/shared/errors';
import type {
  Membership,
  UpdateMembershipServiceDeps,
  UpdateMembershipInput,
} from '../../types/membershipTypes';

export interface UpdateMembershipServiceInput {
  id: string;
  data: UpdateMembershipInput;
}

export const updateMembershipService = async (
  { id, data }: UpdateMembershipServiceInput,
  { updateMembership }: UpdateMembershipServiceDeps,
): Promise<Membership | null> => {
  try {
    return await updateMembership(id, data);
  } catch (error) {
    logger.error('Error updating membership', { membershipId: id, error });
    const serviceError = new SequenceError(`Failed to update membership with ID ${id}`);
    serviceError.cause = error;
    throw serviceError;
  }
};
