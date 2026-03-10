import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';
import type { GetKpisInput, GetAttentionItemsInput } from '../../types/dashboardTypes';

export const kpisMapper = (req: Request): GetKpisInput => {
  const organizationId = req.organizationId;
  const role = req.user?.role;

  if (organizationId === undefined || role === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return { organizationId, role };
};

export const attentionItemsMapper = (req: Request): GetAttentionItemsInput => {
  const organizationId = req.organizationId;

  if (organizationId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return { organizationId };
};
