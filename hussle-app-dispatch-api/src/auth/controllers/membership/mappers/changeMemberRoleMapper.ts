import type { Request } from 'express';
import type { Role } from '@/config/roles';

export interface ChangeMemberRoleInput {
  organizationId: string;
  membershipId: string;
  role: Role;
}

export const changeMemberRoleMapper = (req: Request): ChangeMemberRoleInput => {
  const { role } = req.body as { role: Role };

  return {
    organizationId: req.user?.organizationId ?? '',
    membershipId: String(req.params.membershipId),
    role,
  };
};
