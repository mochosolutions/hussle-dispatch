import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import { Body } from 'components/Typography';
import { DetailLayout } from 'components/DetailLayout';
import DocumentsTab from 'components/DocumentsTab';
import {
  fetchVehicleDetailsRequest,
  fetchVehicleLoadHistoryRequest,
} from '../../store/reducers';
import {
  selectVehicleWithCarrier,
  selectVehicleDetailLoading,
  selectVehicleLoadHistory,
  selectVehicleLoadHistoryLoading,
  selectDriversByCarrierId,
} from '../../store/selectors/vehicleSelectors';
import { VEHICLE_TABS } from '../../constants';
import { VehicleKPI } from '../../components/VehicleKPI';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { VehicleOverviewTab } from '../../components/VehicleDetailPage/VehicleOverviewTab';
import { VehicleExpenseTab } from '../../components/VehicleDetailPage/VehicleExpenseTab';
import { VehicleLoadHistoryTab } from '../../components/VehicleDetailPage/VehicleLoadHistoryTab';

const VehicleDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const vehicleSelector = useMemo(() => selectVehicleWithCarrier(id ?? ''), [id]);
  const vehicle = useSelector(vehicleSelector);
  const isLoading = useSelector(selectVehicleDetailLoading(id ?? ''));
  const carrierId = vehicle?.carrierId ?? null;
  const carrierDriversSelector = useMemo(() => selectDriversByCarrierId(carrierId), [carrierId]);
  const carrierDrivers = useSelector(carrierDriversSelector);
  const vehicleLoads = useSelector(selectVehicleLoadHistory(id ?? ''));
  const loadHistoryLoading = useSelector(selectVehicleLoadHistoryLoading(id ?? ''));

  const [activeTab, setActiveTab] = useState('overview');
  const { openDrawer } = useDrawerActions();

  useEffect(() => {
    if (id) {
      dispatch(fetchVehicleDetailsRequest({ id }));
      dispatch(fetchVehicleLoadHistoryRequest({ vehicleId: id }));
    }
  }, [dispatch, id]);

  const handleOpenInfoDrawer = useCallback(() => {
    if (id) {
      openDrawer('vehicleInfo', { vehicleId: id });
    }
  }, [openDrawer, id]);

  const handleOpenTargetsDrawer = useCallback(() => {
    if (id) {
      openDrawer('vehicleTargets', { vehicleId: id });
    }
  }, [openDrawer, id]);

  const handleBack = () => {
    navigate('/vehicles');
  };

  return (
    <PageWrapper isLoading={isLoading} errorContext="VehicleDetailPage">
      <DataGuard
        data={vehicle}
        emptyComponent={<Body sx={{ p: 4 }}>Vehicle not found.</Body>}
      >
        {(v) => (
          <DetailLayout
            id={v.unitNumber}
            status={v.isActive ? 'VEHICLE_ACTIVE' : 'VEHICLE_INACTIVE'}
            breadcrumb={{ label: 'Vehicles', href: '/vehicles' }}
            onBack={handleBack}
            actions={
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<EditIcon />}
                onClick={handleOpenInfoDrawer}
              >
                Edit
              </Button>
            }
            summary={<VehicleKPI vehicle={v} vehicleLoads={vehicleLoads} />}
            tabs={VEHICLE_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'overview' && (
              <VehicleOverviewTab
                vehicle={v}
                carrierDrivers={carrierDrivers}
                onOpenInfoDrawer={handleOpenInfoDrawer}
              />
            )}

            {activeTab === 'expenses' && (
              <VehicleExpenseTab
                vehicle={v}
                onOpenTargetsDrawer={handleOpenTargetsDrawer}
              />
            )}

            {activeTab === 'load-history' && (
              <VehicleLoadHistoryTab
                vehicleLoads={vehicleLoads}
                isLoading={loadHistoryLoading}
              />
            )}

            {activeTab === 'documents' && id && (
              <DocumentsTab entityType="vehicle" entityId={id} canUpload />
            )}
          </DetailLayout>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default VehicleDetailPage;
