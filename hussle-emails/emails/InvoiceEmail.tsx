import InvoiceEmail from '../src/invoice/InvoiceEmail';
import type { InvoiceEmailData } from '../src/invoice/renderInvoiceEmail';

InvoiceEmail.PreviewProps = {
  invoiceNumber: 'INV-2026-0042',
  loadNumber: 'LD-1087',
  carrierName: 'Acme Logistics LLC',
  totalAmount: '$4,250.00',
  dueDate: 'April 15, 2026',
  paymentTerms: 'Net 30',
  replyToEmail: 'billing@example.com',
} satisfies InvoiceEmailData;

export default InvoiceEmail;
