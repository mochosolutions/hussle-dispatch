import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors/commonErrors';
import type { GenerateApiKeyInput } from '../../types/apiKeyTypes';

export const createApiKeyMapper = (req: Request): GenerateApiKeyInput => {
  if (!req.organizationId) {
    throw new UnauthorizedError('Organization context is required');
  }
  return {
    organizationId: req.organizationId,
    name: req.body.name as string,
  };
};
