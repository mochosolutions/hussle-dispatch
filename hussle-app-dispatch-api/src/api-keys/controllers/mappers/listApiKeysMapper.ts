import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors/commonErrors';

export interface ListApiKeysInput {
  organizationId: string;
}

export const listApiKeysMapper = (req: Request): ListApiKeysInput => {
  if (!req.organizationId) {
    throw new UnauthorizedError('Organization context is required');
  }
  return { organizationId: req.organizationId };
};
