import type { Request } from 'express';
import type { ListCarrierNotesServiceInput } from '../../types/carrierServiceTypes';

export const listCarrierNotesMapper = (req: Request): ListCarrierNotesServiceInput => ({
  carrierId: req.params['carrierId'] ?? '',
  organizationId: req.organizationId ?? '',
  role: req.user?.role ?? '',
  query: req.query,
});
