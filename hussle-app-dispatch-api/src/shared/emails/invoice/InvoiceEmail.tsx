import { Link, Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import DataTable from '../shared/DataTable';
import { contactLine, inlineLink, textBody } from '../shared/emailStyles';
import type { InvoiceEmailData } from './renderInvoiceEmail';

const InvoiceEmail = ({
  invoiceNumber,
  loadNumber,
  carrierName,
  totalAmount,
  dueDate,
  paymentTerms,
  replyToEmail,
  invoiceType,
  senderName,
}: InvoiceEmailData) => {
  const heading = invoiceType === 'DISPATCH_FEE' ? 'Dispatch Fee Invoice' : 'Invoice';
  const fromName = senderName ?? carrierName;

  return (
  <EmailLayout
    preview={`${heading} ${invoiceNumber} for Load ${loadNumber} — ${totalAmount}`}
    headerTitle={`${heading} ${invoiceNumber}`}
    headerSubtitle={`Load ${loadNumber}`}
  >
    <Text style={textBody}>
      From <strong>{fromName}</strong> — please find your invoice details below. The invoice
      document is attached to this email.
    </Text>

    <DataTable
      rows={[
        { label: 'Total Amount', value: totalAmount },
        { label: 'Due Date', value: dueDate },
        { label: 'Payment Terms', value: paymentTerms },
      ]}
    />

    <Text style={contactLine}>
      Questions? Reply to{' '}
      <Link href={`mailto:${replyToEmail}`} style={inlineLink}>
        {replyToEmail}
      </Link>
    </Text>
  </EmailLayout>
  );
};

export default InvoiceEmail;
