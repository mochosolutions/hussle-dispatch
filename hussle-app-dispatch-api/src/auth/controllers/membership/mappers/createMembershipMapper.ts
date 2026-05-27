import type { Request } from 'express';
import { MembershipStatus } from '../../../constants/enums';
import type { CreateMembershipInput } from '../../../types/membershipTypes';

export const createMembershipMapper = (req: Request): CreateMembershipInput => {
  const organizationId = req.params.organizationId ?? '';
  const { userId, role } = req.body as { userId: string; role: string };

  return {
    userId,
    role,
    organizationId,
    status: MembershipStatus.ACTIVE,
  };
};
