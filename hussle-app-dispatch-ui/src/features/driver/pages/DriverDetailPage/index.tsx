import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Box, Typography } from '@mui/material';

import { EmptyState, DataGuard, PageWrapper } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import type { UpdateDriverInput } from 'features/carrier/types';
import { fetchDriverDetailsRequest, updateDriverRequest } from '../../store/reducers';
import {
  selectDriverWithCarrier,
  selectDriverDetailLoading,
} from '../../store/selectors/driverSelectors';
import { DriverInfoDrawer } from '../../components/DriverInfoDrawer';
import { DriverPreferencesDrawer } from '../../components/DriverPreferencesDrawer';
import { DriverLocationDrawer } from '../../components/DriverLocationDrawer';
import { DriverDetailHeader } from './DriverDetailHeader';
import DriverLoadHistoryTab from './tabs/DriverLoadHistoryTab';
import { DriverPreferencesTab } from './tabs/DriverPreferencesTab';
import { DriverOverviewTab } from './tabs/DriverOverviewTab';

const DriverDetailPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const driver = useSelector(selectDriverWithCarrier(id ?? ''));
  const isLoading = useSelector(selectDriverDetailLoading(id ?? ''));
  const [activeTab, setActiveTab] = useState('overview');
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [preferencesDrawerOpen, setPreferencesDrawerOpen] = useState(false);
  const [locationDrawerOpen, setLocationDrawerOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchDriverDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  const handleSaveDriver = useCallback(
    (values: UpdateDriverInput) => {
      if (id) {
        dispatch(updateDriverRequest({ id, data: values }));
      }
    },
    [dispatch, id],
  );

  return (
    <PageWrapper isLoading={isLoading}>
      <DataGuard
        data={driver}
        emptyComponent={<Typography sx={{ p: 4 }}>Driver not found.</Typography>}
      >
        {(d) => (
          <>
            <DriverDetailHeader
              driver={d}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onBackClick={() => navigate('/drivers')}
              onEditClick={() => setInfoDrawerOpen(true)}
            />

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <DriverOverviewTab
                driver={d}
                onEditInfo={() => setInfoDrawerOpen(true)}
                onEditPreferences={() => setPreferencesDrawerOpen(true)}
                onEditLocation={() => setLocationDrawerOpen(true)}
              />
            )}
            {activeTab === 'load-history' && <DriverLoadHistoryTab />}
            {activeTab === 'preferences' && (
              <DriverPreferencesTab
                driver={d}
                onEditPreferences={() => setPreferencesDrawerOpen(true)}
              />
            )}
            {activeTab === 'documents' && (
              <Box sx={{ p: 3 }}>
                <EmptyState title="Documents coming soon" />
              </Box>
            )}

            {/* Drawers */}
            <DriverInfoDrawer
              open={infoDrawerOpen}
              onClose={() => setInfoDrawerOpen(false)}
              data={d}
              onSave={handleSaveDriver}
            />
            <DriverPreferencesDrawer
              open={preferencesDrawerOpen}
              onClose={() => setPreferencesDrawerOpen(false)}
              data={d}
              onSave={handleSaveDriver}
            />
            <DriverLocationDrawer
              open={locationDrawerOpen}
              onClose={() => setLocationDrawerOpen(false)}
              data={d}
              onSave={handleSaveDriver}
            />
          </>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default DriverDetailPage;
