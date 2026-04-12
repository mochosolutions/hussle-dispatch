import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

export interface DocumentIdInput {
  id: string;
  organizationId: string;
}

export const documentIdMapper = (req: Request): DocumentIdInput => {
  const id = req.params['id'];
  if (id === undefined || id.length === 0) {
    throw new ValidationError('Missing required id parameter');
  }

  return { id, organizationId: req.organizationId ?? '' };
};
