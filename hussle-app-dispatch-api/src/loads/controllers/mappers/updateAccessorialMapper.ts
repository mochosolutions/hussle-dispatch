import type { Request } from 'express';
import type { UpdateAccessorialInput } from '../../types/accessorialTypes';

export const updateAccessorialMapper = (req: Request): UpdateAccessorialInput => ({
  id: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
  type: req.body.type,
  description: req.body.description,
  amount: req.body.amount,
  billTo: req.body.billTo,
});
