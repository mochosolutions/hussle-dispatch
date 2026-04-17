import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import DocumentsTab from 'components/DocumentsTab';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { useDispatch, useSelector } from 'store';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import {
  fetchDriverDetailsRequest,
  fetchScheduleRequest,
  deleteOverrideRequest,
} from '../../store/reducers';
import {
  selectDriverWithCarrier,
  selectDriverDetailLoading,
  selectScheduleOverrides,
  selectScheduleLoading,
  selectWeeklySchedule,
} from '../../store/selectors/driverSelectors';
import { DriverKPI } from '../../components/DriverKPI';
import { DRIVER_TABS } from '../../constants';
import DriverLoadHistoryTab from '../../components/DriverDetailPage/DriverLoadHistoryTab';
import { DriverPreferencesTab } from '../../components/DriverDetailPage/DriverPreferencesTab';
import { DriverOverviewTab } from '../../components/DriverDetailPage/DriverOverviewTab';
import { DriverScheduleTab } from '../../components/DriverDetailPage/DriverScheduleTab';

const DriverDetailPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { openDrawer } = useDrawerActions();
  const driverSelector = useMemo(() => selectDriverWithCarrier(id ?? ''), [id]);
  const driver = useSelector(driverSelector);
  const isLoading = useSelector(selectDriverDetailLoading(id ?? ''));
  const [activeTab, setActiveTab] = useState('overview');

  const weeklySchedule = useSelector(selectWeeklySchedule);
  const scheduleOverrides = useSelector(selectScheduleOverrides);
  const scheduleLoading = useSelector(selectScheduleLoading);
  const scheduleFetchedRef = useRef(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchDriverDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      if (tab === 'schedule' && id && !scheduleFetchedRef.current) {
        scheduleFetchedRef.current = true;
        dispatch(fetchScheduleRequest({ driverId: id }));
      }
    },
    [dispatch, id],
  );

  const handleDeleteOverride = useCallback(
    (overrideId: string) => {
      if (id) {
        dispatch(deleteOverrideRequest({ driverId: id, overrideId }));
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
                onClick={() => openDrawer('driverInfo', { driverId: id ?? '' })}
                sx={{ color: 'common.white', borderColor: 'grey.500' }}
              >
                Edit
              </Button>
            }
            summary={<DriverKPI driver={d} />}
            tabs={DRIVER_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          >
            {activeTab === 'overview' && (
              <DriverOverviewTab
                driver={d}
                onEditInfo={() => openDrawer('driverInfo', { driverId: id ?? '' })}
                onEditPreferences={() => openDrawer('driverPreferences', { driverId: id ?? '' })}
                onEditLocation={() => openDrawer('driverLocation', { driverId: id ?? '' })}
              />
            )}
            {activeTab === 'load-history' && <DriverLoadHistoryTab />}
            {activeTab === 'preferences' && (
              <DriverPreferencesTab
                driver={d}
                onEditPreferences={() => openDrawer('driverPreferences', { driverId: id ?? '' })}
              />
            )}
            {activeTab === 'schedule' && (
              <DriverScheduleTab
                weeklySchedule={weeklySchedule}
                overrides={scheduleOverrides}
                isLoading={scheduleLoading}
                onEditWeekly={() => openDrawer('driverWeeklySchedule', { driverId: id ?? '' })}
                onAddOverride={() => openDrawer('driverScheduleOverride', { driverId: id ?? '' })}
                onDeleteOverride={handleDeleteOverride}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab entityType="driver" entityId={id ?? ''} canUpload />
            )}
          </DetailLayout>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default DriverDetailPage;
