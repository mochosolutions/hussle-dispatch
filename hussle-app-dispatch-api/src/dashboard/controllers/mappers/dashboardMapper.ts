import type { Request } from 'express';
import type { GetKpisInput, GetAttentionItemsInput } from '../../types/dashboardTypes';

export const kpisMapper = (req: Request): GetKpisInput => ({
  organizationId: req.organizationId ?? '',
  role: req.user?.role ?? '',
});

export const attentionItemsMapper = (req: Request): GetAttentionItemsInput => ({
  organizationId: req.organizationId ?? '',
});
