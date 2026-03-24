import type { Request } from 'express';
import type { DocumentPacketInput } from '../../types/documentPacketTypes';

export const documentPacketMapper = (req: Request): DocumentPacketInput => ({
  invoiceId: req.params['id'] ?? '',
});
