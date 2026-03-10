import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Stack,
} from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { CarrierDetailTitle } from '../../components/CarrierDetailTitle';
import { CarrierDetailsActions } from '../../components/CarrierDetailsActions';
import { CarrierKPI } from '../../components/CarrierKPI';
import { CARRIER_DETAIL_TAB_ITEMS as tabItems } from '../../constants';
import { selectFormattedCarrierById } from '../../store/selectors/carrierSelectors';
import {
  fetchCarrierDetailsRequest,
  carrierPageSelectors,
} from '../../store/reducers/carrierNewPageSlice';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';
import { InnerPageHeader } from '../../../../components/InnerPageHeader';
import {
  GeneralTab,
  DispatchTermsTab,
  OnboardingTab,
  DriversTab,
  VehiclesTab,
  LoadHistoryTab,
  NotesTab,
  DocumentsTab,
} from './tabs';

const CarrierDetailEditable: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();
  const { id } = useParams();
  const carrier = useSelector(selectFormattedCarrierById(id));
  const isLoading = useSelector(carrierPageSelectors.selectIsEntityLoading('getById', id ?? ''));
  const isError = useSelector(
    (state) => !!carrierPageSelectors.selectEntityError('getById', id ?? '')(state),
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchCarrierDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  const handleBack = () => {
    navigate('/carriers');
  };

  const renderTabContent = () => {
    if (!carrier || !id) {
      return null;
    }

    if (activeTab === 'general') {
      return (
        <GeneralTab
          carrier={carrier}
          onEditCompanyInfo={() => openDrawer('carrierCompanyInfo', { carrierId: id })}
        />
      );
    }

    if (activeTab === 'dispatchTerms') {
      return (
        <DispatchTermsTab
          carrier={carrier}
          onEditTerms={() => openDrawer('carrierDispatchTerms', { carrierId: id })}
        />
      );
    }

    if (activeTab === 'onboarding') {
      return <OnboardingTab carrier={carrier} />;
    }

    if (activeTab === 'drivers') {
      return <DriversTab carrierId={id} />;
    }

    if (activeTab === 'vehicles') {
      return <VehiclesTab carrierId={id} />;
    }

    if (activeTab === 'loadHistory') {
      return <LoadHistoryTab carrierId={id} />;
    }

    if (activeTab === 'documents') {
      return <DocumentsTab carrierId={id} />;
    }

    if (activeTab === 'notes') {
      return <NotesTab carrierId={id} />;
    }

    return null;
  };

  return (
    <PageWrapper isLoading={isLoading} isError={isError} errorContext="CarrierDetailPage">
      <DataGuard data={carrier} emptyComponent={<Typography p={4}>Carrier not found.</Typography>}>
        {(c) => (
          <>
            <Box
              sx={{
                px: 4,
                pt: 2,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <InnerPageHeader
                onBack={handleBack}
                backLabel="Carriers"
                title={
                  <CarrierDetailTitle
                    title={c.name}
                    subTitle="External Carrier"
                    initials={c.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  />
                }
                actions={
                  <CarrierDetailsActions
                    carrierId={c.id}
                    handleEdit={() => openDrawer('carrierCompanyInfo', { carrierId: c.id })}
                  />
                }
              />

              <CarrierKPI c={c} />

              <Box sx={{ marginTop: 1 }}>
                <Tabs
                  value={activeTab}
                  onChange={(_event, value: string) => setActiveTab(value)}
                  variant="scrollable"
                  allowScrollButtonsMobile
                  sx={{ minHeight: 44 }}
                >
                  {tabItems.map((tab) => (
                    <Tab
                      key={tab.key}
                      value={tab.key}
                      sx={{ minHeight: 44 }}
                      label={
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Typography variant="body2">{tab.label}</Typography>
                        </Stack>
                      }
                    />
                  ))}
                </Tabs>
              </Box>
            </Box>

            <Box sx={{ p: 3, maxWidth: 1200 }}>
              {renderTabContent()}
            </Box>
          </>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default CarrierDetailEditable;
