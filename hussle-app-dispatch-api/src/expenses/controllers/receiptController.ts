import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { ReceiptServicePort } from '../services/receiptService';
import { presignReceiptMapper, confirmReceiptMapper } from './mappers/receiptMapper';

interface ReceiptControllerDeps {
  receiptService: ReceiptServicePort;
}

export interface ReceiptControllers {
  presignReceipt: RequestHandler;
  confirmReceipt: RequestHandler;
}

export const createReceiptControllers = (deps: ReceiptControllerDeps): ReceiptControllers => ({
  presignReceipt: async (req: Request, res: Response): Promise<void> => {
    const input = presignReceiptMapper(req);
    const result = await deps.receiptService.presign(input);
    sendSingle(res, result, 201);
  },

  confirmReceipt: async (req: Request, res: Response): Promise<void> => {
    const input = confirmReceiptMapper(req);
    const result = await deps.receiptService.confirm(input);
    sendSingle(res, result);
  },
});
