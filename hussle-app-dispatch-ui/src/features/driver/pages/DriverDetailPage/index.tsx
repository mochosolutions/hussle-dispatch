import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Box, Button, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import { DocumentTable } from 'features/documents/components/DocumentTable';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { useDispatch, useSelector } from 'store';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import type { UpdateDriverInput } from 'features/carrier/types';
import { fetchDriverDetailsRequest, updateDriverRequest } from '../../store/reducers';
import {
  selectDriverWithCarrier,
  selectDriverDetailLoading,
} from '../../store/selectors/driverSelectors';
import { DriverInfoDrawer } from '../../components/DriverInfoDrawer';
import { DriverPreferencesDrawer } from '../../components/DriverPreferencesDrawer';
import { DriverLocationDrawer } from '../../components/DriverLocationDrawer';
import { DriverKPI } from '../../components/DriverKPI';
import { DRIVER_TABS } from '../../constants';
import DriverLoadHistoryTab from './tabs/DriverLoadHistoryTab';
import { DriverPreferencesTab } from './tabs/DriverPreferencesTab';
import { DriverOverviewTab } from './tabs/DriverOverviewTab';

const DriverDetailPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const driverSelector = useMemo(() => selectDriverWithCarrier(id ?? ''), [id]);
  const driver = useSelector(driverSelector);
  const isLoading = useSelector(selectDriverDetailLoading(id ?? ''));
  const [activeTab, setActiveTab] = useState('overview');
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [preferencesDrawerOpen, setPreferencesDrawerOpen] = useState(false);
  const [locationDrawerOpen, setLocationDrawerOpen] = useState(false);
  const { openDrawer } = useDrawerActions();

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

  const handleBack = () => {
    navigate('/drivers');
  };

  return (
    <PageWrapper isLoading={isLoading}>
      <DataGuard
        data={driver}
        emptyComponent={<Typography sx={{ p: 4 }}>Driver not found.</Typography>}
      >
        {(d) => (
          <DetailLayout
            id={getDriverDisplayName(d)}
            status={`DRIVER_${(d.status ?? 'ACTIVE').toUpperCase()}`}
            breadcrumb={{ label: 'Drivers', href: '/drivers' }}
            onBack={handleBack}
            actions={
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setInfoDrawerOpen(true)}
                sx={{ color: 'common.white', borderColor: 'grey.500' }}
              >
                Edit
              </Button>
            }
            summary={<DriverKPI driver={d} />}
            tabs={DRIVER_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
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
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      openDrawer('documentUpload', {
                        context: 'driver-profile',
                        entityType: 'driver',
                        entityId: id ?? '',
                      })
                    }
                  >
                    Upload
                  </Button>
                </Box>
                <DocumentTable entityType="driver" entityId={id ?? ''} />
              </Box>
            )}
          </DetailLayout>
        )}
      </DataGuard>

      {/* Drawers rendered outside DetailLayout to avoid scroll containment */}
      {driver && (
        <>
          <DriverInfoDrawer
            open={infoDrawerOpen}
            onClose={() => setInfoDrawerOpen(false)}
            data={driver}
            onSave={handleSaveDriver}
          />
          <DriverPreferencesDrawer
            open={preferencesDrawerOpen}
            onClose={() => setPreferencesDrawerOpen(false)}
            data={driver}
            onSave={handleSaveDriver}
          />
          <DriverLocationDrawer
            open={locationDrawerOpen}
            onClose={() => setLocationDrawerOpen(false)}
            data={driver}
            onSave={handleSaveDriver}
          />
        </>
      )}
    </PageWrapper>
  );
};

export default DriverDetailPage;
