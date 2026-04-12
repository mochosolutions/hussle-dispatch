import type { Request } from 'express';
import type { CreateCarrierNoteServiceInput } from '../../types/carrierServiceTypes';

export const createCarrierNoteMapper = (req: Request): CreateCarrierNoteServiceInput => {
  const carrierId = req.params['carrierId'] ?? '';
  const body = req.body as { text: string };

  return {
    carrierId,
    organizationId: req.organizationId ?? '',
    role: req.user?.role ?? '',
    input: {
      text: body.text,
      authorId: req.user?.userId,
      authorName: req.user?.email,
    },
  };
};
