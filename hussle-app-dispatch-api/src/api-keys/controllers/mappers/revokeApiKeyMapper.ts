import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors/commonErrors';

export interface RevokeApiKeyInput {
  organizationId: string;
  id: string;
}

export const revokeApiKeyMapper = (req: Request): RevokeApiKeyInput => {
  if (!req.organizationId) {
    throw new UnauthorizedError('Organization context is required');
  }
  return {
    organizationId: req.organizationId,
    id: req.params['id'] ?? '',
  };
};
