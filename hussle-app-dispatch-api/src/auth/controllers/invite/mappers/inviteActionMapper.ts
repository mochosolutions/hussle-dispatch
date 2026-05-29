import type { Request } from 'express';

export interface InviteActionInput {
  organizationId: string;
  inviteId: string;
}

export const inviteActionMapper = (req: Request): InviteActionInput | null => {
  const organizationId = req.params['organizationId'];
  const inviteId = req.params['inviteId'];

  if (typeof organizationId !== 'string' || typeof inviteId !== 'string') {
    return null;
  }

  return { organizationId, inviteId };
};
