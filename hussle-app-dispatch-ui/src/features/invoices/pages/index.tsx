import { Link as RouterLink } from 'react-router-dom';

const invoiceIds = ['INV-1001', 'INV-1002', 'INV-1003'];

const Invoices = () => {
  return (
    <div>
      <h2>Invoices</h2>
      <ul>
        {invoiceIds.map((invoiceId) => (
          <li key={invoiceId}>
            <RouterLink to={`/invoices/${invoiceId}`}>{invoiceId}</RouterLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Invoices;
