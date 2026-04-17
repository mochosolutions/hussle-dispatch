import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Box, Button } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useDispatch, useSelector } from 'store';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import SectionCard from 'components/SectionCard';
import { Body } from 'components/Typography';
import { getContactStats } from 'utils/api/fleet/contactApi';
import type { ContactStats } from 'utils/api/fleet/contactApi';
import {
  selectFormattedContactById,
  selectContactDetailLoading,
} from '../../store/selectors/contactSelectors';
import {
  fetchContactDetailsRequest,
  contactPageSelectors,
} from '../../store/reducers/contactPageSlice';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { CONTACT_DETAIL_TABS } from '../../constants';
import ContactSummaryBar from '../../components/ContactDetailPage/ContactSummaryBar';
import OverviewTab from '../../components/ContactDetailPage/OverviewTab';
import LoadsTab from '../../components/ContactDetailPage/LoadsTab';

const ContactDetailPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();
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
    const controller = new AbortController();
    Promise.resolve()
      .then(() => {
        setStatsLoading(true);
        return getContactStats(id);
      })
      .then((stats) => {
        if (!controller.signal.aborted) {
          setContactStats(stats);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setContactStats(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setStatsLoading(false);
        }
      });
    return () => {
      controller.abort();
    };
  }, [id]);

  const handleBack = () => {
    navigate('/contacts');
  };

  const handleOpenEdit = () => {
    if (contact) {
      openDrawer('contactInfo', { contactId: contact.id });
    }
  };

  return (
    <PageWrapper isLoading={isLoading} isError={isError} errorContext="ContactDetailPage">
      <DataGuard data={contact} emptyComponent={<Body sx={{ p: 4 }}>Contact not found.</Body>}>
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
                onClick={handleOpenEdit}
                sx={{ color: 'common.white', borderColor: 'grey.500' }}
              >
                Edit Contact
              </Button>
            }
            summary={
              <ContactSummaryBar
                contact={c}
                loadCount={statsLoading ? '\u2026' : String(contactStats?.loadCount ?? '\u2014')}
              />
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
              <OverviewTab contact={c} contactStats={contactStats} statsLoading={statsLoading} />
            )}

            {activeTab === 'loads' && (
              <LoadsTab contactStats={contactStats} statsLoading={statsLoading} />
            )}

            {activeTab === 'notes' && (
              <SectionCard title="Notes">
                <Body sx={{ p: 2 }}>{'\u2014'}</Body>
              </SectionCard>
            )}
          </DetailLayout>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default ContactDetailPage;
