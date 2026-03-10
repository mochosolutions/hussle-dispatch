import type { Request } from 'express';
import { UnauthorizedError, ValidationError } from '@/shared/errors';
import type { ConfirmInput } from '../../types/documentTypes';

export const confirmMapper = (req: Request): ConfirmInput => {
  const organizationId = req.organizationId;
  if (organizationId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const documentId = req.params['id'];
  if (documentId === undefined || documentId.length === 0) {
    throw new ValidationError('Missing required id parameter');
  }

  return {
    documentId,
    organizationId,
  };
};
