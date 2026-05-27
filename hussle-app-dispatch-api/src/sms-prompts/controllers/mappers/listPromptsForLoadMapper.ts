import type { Request } from 'express';
import { parsePaginationParams } from '@/shared/pagination';
import type { ListPromptsForLoadInput } from '../../services/smsPromptService';

export const listPromptsForLoadMapper = (
  req: Request,
): ListPromptsForLoadInput => {
  const { page, limit } = parsePaginationParams(req.query);
  return {
    loadId: req.params['loadId'] ?? '',
    organizationId: req.organizationId ?? '',
    page,
    limit,
  };
};
