import type { Logger } from '../../shared/utils/logger';
import type { InvoiceRepoPort } from '../types/invoiceTypes';
import type { DocumentQueryPort, DocumentPacketPort } from '../types/documentPacketTypes';
import type { PdfGenerationPort } from '../types/invoiceTemplateTypes';
import type { InvoiceLoadQueryPort } from '../types/invoiceTypes';
import type { OrgSettingsQueryPort } from '../types/readinessTypes';
import type { StorageProvider } from '../../shared/storage/storageProvider';
import { buildInvoicePdfData } from './invoicePdfDataBuilder';

interface DocumentPacketServiceDeps {
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  orgSettingsQuery: OrgSettingsQueryPort;
  documentQuery: DocumentQueryPort;
  pdfService: PdfGenerationPort;
  storageProvider: StorageProvider;
  logger: Logger;
}

const sanitizeFilename = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]/g, '_');

const getDocumentLabel = (docType: string): string => {
  const labels: Record<string, string> = {
    BROKER_RATE_CON: 'Rate_Confirmation',
    BOL_SIGNED: 'BOL_Signed',
    BOL_UNSIGNED: 'BOL_Unsigned',
    POD: 'Proof_of_Delivery',
    LUMPER_RECEIPT: 'Lumper_Receipt',
    SCALE_TICKET: 'Scale_Ticket',
    DETENTION: 'Detention_Receipt',
    INVOICE: 'Invoice',
  };
  return labels[docType] ?? docType;
};

const getFileExtension = (fileName: string): string => {
  const dotIdx = fileName.lastIndexOf('.');
  if (dotIdx === -1) return '';
  return fileName.substring(dotIdx);
};

export const createDocumentPacketService = (
  deps: DocumentPacketServiceDeps,
): DocumentPacketPort => ({
  generatePacket: async ({ invoiceId, organizationId }): Promise<Buffer> => {
    const invoice = await deps.invoiceRepo.findById(invoiceId, organizationId);

    if (invoice === null) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // Generate the invoice PDF
    const pdfData = await buildInvoicePdfData(invoice, {
      loadQuery: deps.loadQuery,
      orgSettingsQuery: deps.orgSettingsQuery,
      logger: deps.logger,
    });
    const pdfBuffer = await deps.pdfService.generateInvoicePdf(pdfData);

    // Fetch load documents
    const loadDocs = await deps.documentQuery.findConfirmedByEntity('load', invoice.loadId);

    // Build ZIP using archiver
    const archiver = await import('archiver');
    const { PassThrough } = await import('stream');

    const buffers: Buffer[] = [];
    const passThrough = new PassThrough();

    passThrough.on('data', (chunk: Buffer) => {
      buffers.push(chunk);
    });

    const archive = archiver.default('zip', { zlib: { level: 6 } });
    archive.pipe(passThrough);

    const folderName = `Invoice_${invoice.invoiceNumber}_Load_${invoice.load.loadNumber}`;

    // Add invoice PDF
    archive.append(pdfBuffer, {
      name: `${folderName}/Invoice_${invoice.invoiceNumber}.pdf`,
    });

    // Add load documents
    for (const doc of loadDocs) {
      try {
        const content = await deps.storageProvider.getFile(doc.s3Key);
        const ext = getFileExtension(doc.fileName);
        const label = getDocumentLabel(doc.type);
        const safeName = sanitizeFilename(`${label}${ext}`);
        archive.append(content, { name: `${folderName}/${safeName}` });
      } catch (error: unknown) {
        deps.logger.warn('Failed to fetch document for packet', {
          documentId: doc.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await archive.finalize();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      passThrough.on('end', resolve);
      passThrough.on('error', reject);
    });

    deps.logger.info('Document packet generated', {
      invoiceId,
      documentCount: loadDocs.length + 1,
    });

    return Buffer.concat(buffers);
  },
});
