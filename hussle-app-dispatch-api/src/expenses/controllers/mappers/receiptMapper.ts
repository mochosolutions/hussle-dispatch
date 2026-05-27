import type { Request } from 'express';
import type { PresignReceiptInput, ConfirmReceiptInput } from '../../services/receiptService';

export const presignReceiptMapper = (req: Request): PresignReceiptInput => {
  const body = req.body as {
    fileName: string;
    mimeType: string;
  };

  return {
    expenseId: req.params['id'] ?? '',
    organizationId: req.organizationId ?? '',
    fileName: body.fileName,
    mimeType: body.mimeType,
  };
};

export const confirmReceiptMapper = (req: Request): ConfirmReceiptInput => ({
  expenseId: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
});
