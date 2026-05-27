import { pdf } from '@react-pdf/renderer';

import type { InvoiceData } from './types';
import { InvoicePdfTemplate } from './InvoicePdfTemplate';

/**
 * Generates an invoice PDF blob from invoice data.
 * Returns the blob for upload or download.
 */
const generateInvoicePdf = async (invoice: InvoiceData): Promise<Blob> => {
  const document = <InvoicePdfTemplate invoice={invoice} />;
  const blob = await pdf(document).toBlob();
  return blob;
};

/**
 * Generates and triggers a browser download of the invoice PDF.
 */
const downloadInvoicePdf = async (invoice: InvoiceData): Promise<void> => {
  const blob = await generateInvoicePdf(invoice);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${invoice.invoiceNumber}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

export { generateInvoicePdf, downloadInvoicePdf };
