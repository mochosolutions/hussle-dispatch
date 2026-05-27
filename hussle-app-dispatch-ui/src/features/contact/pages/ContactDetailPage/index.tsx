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
import {
  selectFormattedContactById,
  selectContactStats,
  selectContactStatsLoading,
} from '../../store/selectors/contactSelectors';
import {
  fetchContactDetailsRequest,
  fetchContactStatsRequest,
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
  const isError = useSelector(
    (state) => !!contactPageSelectors.selectEntityError('getById', id ?? '')(state),
  );

  const contactStats = useSelector(selectContactStats);
  const statsLoading = useSelector(selectContactStatsLoading);

  useEffect(() => {
    if (id) {
      dispatch(fetchContactDetailsRequest({ id }));
      dispatch(fetchContactStatsRequest({ id }));
    }
  }, [dispatch, id]);

  const handleBack = () => {
    navigate('/contacts');
  };

  const handleOpenEdit = () => {
    if (contact) {
      openDrawer('contactInfo', { contactId: contact.id });
    }
  };

  return (
    <PageWrapper isError={isError} errorContext="ContactDetailPage">
      <DataGuard data={contact} emptyComponent={<Body sx={{ p: 4 }}>Contact not found.</Body>}>
        {(c) => (
          <DetailLayout
            id={[c.firstName, c.lastName].filter(Boolean).join(' ')}
            status={c.deletedAt ? 'Inactive' : 'Active'}
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
