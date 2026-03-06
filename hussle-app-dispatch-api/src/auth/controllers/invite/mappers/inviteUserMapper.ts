import type { Request } from 'express';

export interface InviteUserInput {
  users: { email: string; role: string }[];
  organizationId: string;
  userOrganizationId: string;
}

export const inviteUserMapper = (req: Request): InviteUserInput | null => {
  const { user } = req;
  const organizationId = req.params['organizationId'];

  if (!user) {
    return null;
  }

  if (typeof organizationId !== 'string') {
    return null;
  }

  return {
    users: req.body.users,
    organizationId,
    userOrganizationId: user.organizationId,
  };
};
