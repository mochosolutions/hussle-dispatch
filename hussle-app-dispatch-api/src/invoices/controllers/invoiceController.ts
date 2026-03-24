import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { InvoiceService } from '../types/invoiceServiceTypes';
import {
  listInvoicesMapper,
  getInvoiceByIdMapper,
  updateInvoiceMapper,
  deleteInvoiceMapper,
  approveInvoiceMapper,
  sendInvoiceMapper,
  markPaidMapper,
} from './mappers/invoiceMapper';
import {
  toInvoiceDetailResponse,
  toInvoiceListResponse,
} from './transformers/invoiceTransformer';

interface InvoiceControllerDeps {
  invoiceService: InvoiceService;
}

export interface InvoiceControllers {
  listInvoices: RequestHandler;
  getInvoiceById: RequestHandler;
  updateInvoice: RequestHandler;
  deleteInvoice: RequestHandler;
  approveInvoice: RequestHandler;
  sendInvoice: RequestHandler;
  markPaid: RequestHandler;
  getCounts: RequestHandler;
}

export const createInvoiceControllers = (
  deps: InvoiceControllerDeps,
): InvoiceControllers => ({
  listInvoices: async (req: Request, res: Response): Promise<void> => {
    const input = listInvoicesMapper(req);
    const items = await deps.invoiceService.listInvoices(input);
    sendSingle(res, toInvoiceListResponse(items));
  },

  getInvoiceById: async (req: Request, res: Response): Promise<void> => {
    const input = getInvoiceByIdMapper(req);
    const invoice = await deps.invoiceService.getInvoiceById(input);
    sendSingle(res, toInvoiceDetailResponse(invoice));
  },

  updateInvoice: async (req: Request, res: Response): Promise<void> => {
    const input = updateInvoiceMapper(req);
    const invoice = await deps.invoiceService.updateInvoice(input);
    sendSingle(res, toInvoiceDetailResponse(invoice));
  },

  deleteInvoice: async (req: Request, res: Response): Promise<void> => {
    const input = deleteInvoiceMapper(req);
    await deps.invoiceService.deleteInvoice(input);
    res.status(204).send();
  },

  approveInvoice: async (req: Request, res: Response): Promise<void> => {
    const input = approveInvoiceMapper(req);
    const invoice = await deps.invoiceService.approveInvoice(input);
    sendSingle(res, toInvoiceDetailResponse(invoice));
  },

  sendInvoice: async (req: Request, res: Response): Promise<void> => {
    const input = sendInvoiceMapper(req);
    const invoice = await deps.invoiceService.sendInvoice(input);
    sendSingle(res, toInvoiceDetailResponse(invoice));
  },

  markPaid: async (req: Request, res: Response): Promise<void> => {
    const input = markPaidMapper(req);
    const invoice = await deps.invoiceService.markPaid(input);
    sendSingle(res, toInvoiceDetailResponse(invoice));
  },

  getCounts: async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId ?? '';
    const draftCount = await deps.invoiceService.getDraftCount(organizationId);
    sendSingle(res, { draft: draftCount });
  },
});
