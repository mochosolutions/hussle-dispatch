import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';
import type { ListCarrierNotesServiceInput } from '../../types/carrierServiceTypes';

export const listCarrierNotesMapper = (req: Request): ListCarrierNotesServiceInput => {
  const organizationId = req.organizationId;
  const role = req.user?.role;

  if (organizationId === undefined || role === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const carrierId = req.params['carrierId'] ?? '';

  return {
    carrierId,
    organizationId,
    role,
    query: req.query,
  };
};
