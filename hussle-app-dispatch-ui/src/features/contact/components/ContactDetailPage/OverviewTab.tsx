import { useMemo } from 'react';
import { Box, CircularProgress, Grid, Stack } from '@mui/material';
import { format, parseISO } from 'date-fns';
import SectionCard from 'components/SectionCard';
import { DetailRow, LinkText, BodyMuted } from 'components/Typography';
import { StatusBadge } from 'components/Statusbadge';
import { useSelector } from 'store';
import { selectFormattedCustomerById } from 'features/customer/store/selectors/customerSelectors';
import type { ContactStats } from 'utils/api/fleet/contactApi';
import type { Contact } from '../../types';

interface OverviewTabProps {
  contact: Contact & { createdAt: string; updatedAt: string };
  contactStats: ContactStats | null;
  statsLoading: boolean;
}

const OverviewTab = ({ contact, contactStats, statsLoading }: OverviewTabProps) => {
  const customerSelector = useMemo(
    () => selectFormattedCustomerById(contact.customerId ?? undefined),
    [contact.customerId],
  );
  const customer = useSelector(customerSelector);

  const customerDisplay = contact.customerId ? (
    <LinkText>{customer?.companyName ?? contact.customerId}</LinkText>
  ) : (
    '\u2014'
  );

  const phoneDisplay = contact.phone ? (
    <a
      href={`tel:${contact.phone}`}
      style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}
    >
      {contact.phone}
    </a>
  ) : (
    '\u2014'
  );

  const emailDisplay = contact.email ? (
    <a
      href={`mailto:${contact.email}`}
      style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}
    >
      {contact.email}
    </a>
  ) : (
    '\u2014'
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <SectionCard title="Contact Information">
          <DetailRow
            label="Full Name"
            value={[contact.firstName, contact.lastName].filter(Boolean).join(' ')}
          />
          <DetailRow label="Role" value={contact.role ?? '\u2014'} />
          <DetailRow label="Phone" value={phoneDisplay} />
          <DetailRow label="Email" value={emailDisplay} />
          <DetailRow label="Customer" value={customerDisplay} />
          <DetailRow label="Notes" value={contact.notes ?? '\u2014'} noBorder />
        </SectionCard>
      </Grid>

      <Grid item xs={12} md={4}>
        <SectionCard title="Recent Loads">
          {statsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!statsLoading && (!contactStats || contactStats.recentLoads.length === 0) && (
            <BodyMuted sx={{ p: 2 }}>No load history available</BodyMuted>
          )}
          {!statsLoading && contactStats && contactStats.recentLoads.length > 0 && (
            <Stack
              spacing={0}
              divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}
            >
              {contactStats.recentLoads.map((load) => (
                <Box
                  key={load.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Box>
                    <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{load.loadNumber}</Box>
                    <BodyMuted>
                      {load.pickupDate
                        ? format(parseISO(load.pickupDate), 'MMM d, yyyy')
                        : '\u2014'}
                    </BodyMuted>
                  </Box>
                  <StatusBadge status={`LOAD_${load.status}`} size="small" />
                </Box>
              ))}
            </Stack>
          )}
        </SectionCard>
      </Grid>
    </Grid>
  );
};

export default OverviewTab;
