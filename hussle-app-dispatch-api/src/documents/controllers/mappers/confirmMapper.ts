import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import type { ConfirmInput } from '../../types/documentTypes';

export const confirmMapper = (req: Request): ConfirmInput => {
  const documentId = req.params['id'];
  if (documentId === undefined || documentId.length === 0) {
    throw new ValidationError('Missing required id parameter');
  }

  return {
    documentId,
    organizationId: req.organizationId ?? '',
  };
};
