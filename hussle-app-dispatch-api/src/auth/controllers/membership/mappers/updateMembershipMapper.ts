import type { Request } from 'express';
import type { UpdateMembershipInput } from '../../../types/membershipTypes';

interface UpdateMembershipMapperInput {
  organizationId: string;
  membershipId: string;
  data: UpdateMembershipInput;
}

export const updateMembershipMapper = (req: Request): UpdateMembershipMapperInput => {
  const organizationId = req.params.organizationId ?? '';
  const membershipId = req.params.membershipId ?? '';
  const { role, status } = req.body as { role?: string; status?: string };

  return {
    organizationId,
    membershipId,
    data: {
      ...(role && role.length > 0 && { role }),
      ...(status && status.length > 0 && { status }),
    },
  };
};
