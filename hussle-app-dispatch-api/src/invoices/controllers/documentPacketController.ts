import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import type { DocumentPacketPort } from '../types/documentPacketTypes';
import type { InvoiceRepoPort } from '../types/invoiceTypes';
import { NotFoundError } from '@/shared/errors';
import { documentPacketMapper } from './mappers/documentPacketMapper';

interface DocumentPacketControllerDeps {
  documentPacketService: DocumentPacketPort;
  invoiceRepo: InvoiceRepoPort;
}

export interface DocumentPacketControllers {
  downloadPacket: RequestHandler;
}

export const createDocumentPacketControllers = (
  deps: DocumentPacketControllerDeps,
): DocumentPacketControllers => ({
  downloadPacket: async (req: Request, res: Response): Promise<void> => {
    const input = documentPacketMapper(req);
    const invoice = await deps.invoiceRepo.findById(input.invoiceId);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    const zipBuffer = await deps.documentPacketService.generatePacket(input);

    const fileName = `Invoice_${invoice.invoiceNumber}_Packet.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(zipBuffer);
  },
});
