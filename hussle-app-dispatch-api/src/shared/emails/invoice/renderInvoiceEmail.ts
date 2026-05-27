import { render } from '@react-email/components';
import InvoiceEmail from './InvoiceEmail';

export type InvoiceEmailType = 'CUSTOMER' | 'DISPATCH_FEE';

export interface InvoiceEmailData {
  invoiceNumber: string;
  loadNumber: string;
  carrierName: string;
  totalAmount: string;
  dueDate: string;
  paymentTerms: string;
  replyToEmail: string;
  invoiceType?: InvoiceEmailType;
  senderName?: string;
}

export const renderInvoiceEmail = async (
  data: InvoiceEmailData,
): Promise<{ subject: string; html: string }> => {
  const invoiceType: InvoiceEmailType = data.invoiceType ?? 'CUSTOMER';
  const senderName = data.senderName ?? data.carrierName;
  const subject =
    invoiceType === 'DISPATCH_FEE'
      ? `Dispatch Fee Invoice ${data.invoiceNumber} from ${senderName}`
      : `Invoice ${data.invoiceNumber} from ${senderName}`;

  return {
    subject,
    html: await render(InvoiceEmail({ ...data, invoiceType, senderName })),
  };
};
