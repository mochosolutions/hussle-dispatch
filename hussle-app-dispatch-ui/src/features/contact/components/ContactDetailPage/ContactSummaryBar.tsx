import { useMemo } from 'react';
import { Box } from '@mui/material';
import { KpiCell, LinkText } from 'components/Typography';
import { useSelector } from 'store';
import { selectFormattedCustomerById } from 'features/customer/store/selectors/customerSelectors';
import type { Contact } from '../../types';

interface ContactSummaryBarProps {
  contact: Contact & { createdAt: string; updatedAt: string };
  loadCount: string;
}

const ContactSummaryBar = ({ contact, loadCount }: ContactSummaryBarProps) => {
  const customerSelector = useMemo(
    () => selectFormattedCustomerById(contact.customerId ?? undefined),
    [contact.customerId],
  );
  const customer = useSelector(customerSelector);

  const customerDisplay = contact.customerId ? (
    <LinkText>{customer?.companyName ?? contact.customerId}</LinkText>
  ) : (
    'Independent'
  );

  return (
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      <KpiCell label="Customer" value={customerDisplay} />
      <KpiCell label="Role" value={contact.role ?? '\u2014'} />
      <KpiCell label="Phone" value={contact.phone ?? '\u2014'} />
      <KpiCell label="Email" value={contact.email ?? '\u2014'} />
      <KpiCell label="Loads as Contact" value={loadCount} />
    </Box>
  );
};

export default ContactSummaryBar;
