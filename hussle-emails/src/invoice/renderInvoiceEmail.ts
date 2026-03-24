import { render } from '@react-email/components';
import InvoiceEmail from './InvoiceEmail';

export interface InvoiceEmailData {
  invoiceNumber: string;
  loadNumber: string;
  carrierName: string;
  totalAmount: string;
  dueDate: string;
  paymentTerms: string;
  replyToEmail: string;
}

export const renderInvoiceEmail = async (
  data: InvoiceEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `Invoice ${data.invoiceNumber} from ${data.carrierName}`,
  html: await render(InvoiceEmail(data)),
});
