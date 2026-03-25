import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { format, parseISO } from 'date-fns';
import { useDispatch, useSelector } from 'store';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import SectionCard from 'components/SectionCard';
import { KpiCell, DetailRow, LinkText } from 'components/Typography';
import { StatusBadge } from 'components/Statusbadge';
import { getContactStats } from 'utils/api/fleet/contactApi';
import type { ContactStats } from 'utils/api/fleet/contactApi';
import { selectFormattedContactById, selectContactDetailLoading } from '../../store/selectors/contactSelectors';
import {
  fetchContactDetailsRequest,
  contactPageSelectors,
} from '../../store/reducers/contactPageSlice';
import { ContactInfoDrawer } from '../../components/ContactInfoDrawer';
import { CONTACT_DETAIL_TABS } from '../../constants';

const ContactDetailPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const contactSelector = useMemo(() => selectFormattedContactById(id), [id]);
  const contact = useSelector(contactSelector);
  const isLoading = useSelector(selectContactDetailLoading(id ?? ''));
  const isError = useSelector(
    (state) => !!contactPageSelectors.selectEntityError('getById', id ?? '')(state),
  );

  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchContactDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) {
      return;
    }
    setStatsLoading(true);
    getContactStats(id)
      .then(setContactStats)
      .catch(() => setContactStats(null))
      .finally(() => setStatsLoading(false));
  }, [id]);

  const handleBack = () => {
    navigate('/contacts');
  };

  const fullName = contact ? [contact.firstName, contact.lastName].filter(Boolean).join(' ') : '';

  return (
    <PageWrapper isLoading={isLoading} isError={isError} errorContext="ContactDetailPage">
      <DataGuard data={contact} emptyComponent={<Typography p={4}>Contact not found.</Typography>}>
        {(c) => (
          <DetailLayout
            id={[c.firstName, c.lastName].filter(Boolean).join(' ')}
            status="Active"
            breadcrumb={{ label: 'Contacts', href: '/contacts' }}
            onBack={handleBack}
            actions={
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditOutlinedIcon />}
                onClick={() => setDrawerOpen(true)}
                sx={{ color: 'common.white', borderColor: 'grey.500' }}
              >
                Edit Contact
              </Button>
            }
            summary={
              <>
                <KpiCell
                  label="Customer"
                  value={c.customerId ? <LinkText>{c.customerId}</LinkText> : 'Independent'}
                />
                <KpiCell label="Role" value={c.role ?? '\u2014'} />
                <KpiCell label="Phone" value={c.phone ?? '\u2014'} />
                <KpiCell label="Email" value={c.email ?? '\u2014'} />
                <KpiCell
                  label="Loads as Contact"
                  value={statsLoading ? '\u2026' : String(contactStats?.loadCount ?? '\u2014')}
                />
              </>
            }
            tabs={CONTACT_DETAIL_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {/* Quick Action Strip */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
              {c.phone && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PhoneIcon />}
                  component="a"
                  href={`tel:${c.phone}`}
                >
                  Call
                </Button>
              )}
              {c.email && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EmailIcon />}
                  component="a"
                  href={`mailto:${c.email}`}
                >
                  Email
                </Button>
              )}
            </Box>

            {activeTab === 'overview' && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3,
                }}
              >
                <SectionCard title="Contact Information">
                  <DetailRow
                    label="Full Name"
                    value={[c.firstName, c.lastName].filter(Boolean).join(' ')}
                  />
                  <DetailRow label="Role" value={c.role ?? '\u2014'} />
                  <DetailRow
                    label="Phone"
                    value={
                      c.phone ? (
                        <Typography
                          component="a"
                          href={`tel:${c.phone}`}
                          variant="body1"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontWeight: 600,
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {c.phone}
                        </Typography>
                      ) : (
                        '\u2014'
                      )
                    }
                  />
                  <DetailRow
                    label="Email"
                    value={
                      c.email ? (
                        <Typography
                          component="a"
                          href={`mailto:${c.email}`}
                          variant="body1"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontWeight: 600,
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {c.email}
                        </Typography>
                      ) : (
                        '\u2014'
                      )
                    }
                  />
                  <DetailRow
                    label="Customer"
                    value={
                      c.customerId ? (
                        <LinkText>{c.customerId}</LinkText>
                      ) : (
                        '\u2014'
                      )
                    }
                  />
                  <DetailRow label="Notes" value={c.notes ?? '\u2014'} noBorder />
                </SectionCard>

                <SectionCard title="Recent Loads">
                  {statsLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  )}
                  {!statsLoading && (!contactStats || contactStats.recentLoads.length === 0) && (
                    <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                      No load history available
                    </Typography>
                  )}
                  {!statsLoading && contactStats && contactStats.recentLoads.length > 0 && (
                    <Stack spacing={0} divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
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
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {load.loadNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {load.pickupDate
                                ? format(parseISO(load.pickupDate), 'MMM d, yyyy')
                                : '\u2014'}
                            </Typography>
                          </Box>
                          <StatusBadge status={`LOAD_${load.status}`} size="small" />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </SectionCard>
              </Box>
            )}

            {activeTab === 'loads' && (
              <SectionCard title="Load History">
                {statsLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
                {!statsLoading && (!contactStats || contactStats.recentLoads.length === 0) && (
                  <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                    No load history available
                  </Typography>
                )}
                {!statsLoading && contactStats && contactStats.recentLoads.length > 0 && (
                  <Stack spacing={0} divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
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
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {load.loadNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {load.pickupDate
                              ? format(parseISO(load.pickupDate), 'MMM d, yyyy')
                              : '\u2014'}
                          </Typography>
                        </Box>
                        <StatusBadge status={`LOAD_${load.status}`} size="small" />
                      </Box>
                    ))}
                  </Stack>
                )}
              </SectionCard>
            )}

            {activeTab === 'notes' && (
              <SectionCard title="Notes">
                <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                  {'\u2014'}
                </Typography>
              </SectionCard>
            )}

            {drawerOpen && (
              <ContactInfoDrawer
                contact={c}
                onClose={() => setDrawerOpen(false)}
              />
            )}
          </DetailLayout>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default ContactDetailPage;
