import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';
import type { CreateCarrierNoteServiceInput } from '../../types/carrierServiceTypes';

export const createCarrierNoteMapper = (req: Request): CreateCarrierNoteServiceInput => {
  const organizationId = req.organizationId;
  const role = req.user?.role;
  const userId = req.user?.userId;
  const userName = req.user?.email;

  if (organizationId === undefined || role === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const carrierId = req.params['carrierId'] ?? '';
  const body = req.body as { text: string };

  return {
    carrierId,
    organizationId,
    role,
    input: {
      text: body.text,
      authorId: userId,
      authorName: userName,
    },
  };
};
