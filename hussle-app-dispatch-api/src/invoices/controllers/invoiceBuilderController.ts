import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { InvoiceBuilderService } from '../services/invoiceBuilderService';
import { toInvoiceDetailResponse } from './transformers/invoiceTransformer';
import { createFromLoadMapper } from './mappers/createFromLoadMapper';

interface InvoiceBuilderControllerDeps {
  invoiceBuilderService: InvoiceBuilderService;
}

export interface InvoiceBuilderControllers {
  createFromLoad: RequestHandler;
  voidInvoice: RequestHandler;
}

export const createInvoiceBuilderControllers = (
  deps: InvoiceBuilderControllerDeps,
): InvoiceBuilderControllers => ({
  createFromLoad: async (req: Request, res: Response): Promise<void> => {
    const input = createFromLoadMapper(req);
    const invoice = await deps.invoiceBuilderService.createFromLoad(input);
    sendSingle(res, toInvoiceDetailResponse(invoice), 201);
  },

  voidInvoice: async (req: Request, res: Response): Promise<void> => {
    const invoiceId = req.params['id'] ?? '';
    const organizationId = req.organizationId ?? '';
    const userId = req.user?.userId ?? '';

    const invoice = await deps.invoiceBuilderService.voidInvoice({
      invoiceId,
      organizationId,
      userId,
    });
    sendSingle(res, toInvoiceDetailResponse(invoice));
  },
});
