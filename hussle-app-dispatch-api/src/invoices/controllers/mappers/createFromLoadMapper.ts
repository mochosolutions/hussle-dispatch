import type { Request } from 'express';
import type { CreateFromLoadInput } from '../../services/invoiceBuilderService';

export const createFromLoadMapper = (req: Request): CreateFromLoadInput => ({
  loadId: req.params['loadId'] ?? '',
  organizationId: req.organizationId ?? '',
  userId: req.user?.userId ?? '',
});
