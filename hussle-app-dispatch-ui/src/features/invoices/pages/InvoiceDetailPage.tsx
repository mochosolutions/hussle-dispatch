import { Link as RouterLink, useParams } from 'react-router-dom';

const InvoiceDetailPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  return (
    <div>
      <h2>Invoice Detail</h2>
      <p>Invoice ID: {invoiceId ?? 'Unknown'}</p>
      <RouterLink to="/invoices">Back to invoices</RouterLink>
    </div>
  );
};

export default InvoiceDetailPage;
