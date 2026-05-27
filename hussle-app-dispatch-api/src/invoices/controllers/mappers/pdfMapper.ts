import type { Request } from 'express';

export interface PdfRequestInput {
  invoiceId: string;
  organizationId: string;
}

export const pdfMapper = (req: Request): PdfRequestInput => ({
  invoiceId: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
});
