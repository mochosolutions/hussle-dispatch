import type { Membership, DeleteMembershipServiceDeps } from '../../types/membershipTypes';

export const deleteMembershipService = async (
  id: string,
  { deleteById }: DeleteMembershipServiceDeps,
  context?: any
): Promise<Membership | null> => {
  try {
    return await deleteById(id, context);
  } catch (error) {
    // Optionally log or handle error as needed
    throw Error(`Failed to delete membership with ID ${id}`);
  }
};
