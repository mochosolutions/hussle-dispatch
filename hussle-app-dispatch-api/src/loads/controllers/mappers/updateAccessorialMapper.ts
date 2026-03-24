import type { Request } from 'express';
import type { UpdateAccessorialInput } from '../../types/accessorialTypes';
import { UnauthorizedError } from '@/shared/errors';

export const updateAccessorialMapper = (req: Request): UpdateAccessorialInput => {
  const organizationId = req.organizationId;
  const id = req.params['id'];

  if (organizationId === undefined || id === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return {
    id,
    organizationId,
    type: req.body.type,
    description: req.body.description,
    amount: req.body.amount,
    billTo: req.body.billTo,
  };
};
