import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import { DetailLayout } from 'components/DetailLayout';
import {
  fetchVehicleDetailsRequest,
  fetchVehicleLoadHistoryRequest,
  updateVehicleRequest,
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
import { VehicleInfoDrawer } from '../../components/VehicleInfoDrawer';
import { VehicleExpenseDrawer } from '../../components/VehicleExpenseDrawer';
import { VehicleTargetsDrawer } from '../../components/VehicleTargetsDrawer';
import { DocumentUpload } from 'features/documents/components/DocumentUpload';
import { VehicleOverviewTab } from './tabs/VehicleOverviewTab';
import { VehicleExpenseTab } from './tabs/VehicleExpenseTab';
import { VehicleLoadHistoryTab } from './tabs/VehicleLoadHistoryTab';

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

  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [targetsDrawerOpen, setTargetsDrawerOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchVehicleDetailsRequest({ id }));
      dispatch(fetchVehicleLoadHistoryRequest({ vehicleId: id }));
    }
  }, [dispatch, id]);

  const kpiCpm = useMemo(() => {
    if (!vehicle) return 0;
    const monthlyTotal = vehicle.expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.monthlyAmount),
      0,
    );
    const target = vehicle.monthlyMilesTarget ?? 0;
    return target > 0 ? monthlyTotal / target : 0;
  }, [vehicle]);

  const kpiMonthlyTotal = useMemo(() => {
    if (!vehicle) return 0;
    return vehicle.expenses.reduce((sum, exp) => sum + parseFloat(exp.monthlyAmount), 0);
  }, [vehicle]);

  const handleDrawerSave = useCallback(
    (values: Record<string, unknown>) => {
      if (id) {
        dispatch(updateVehicleRequest({ id, data: values }));
      }
    },
    [dispatch, id],
  );

  const handleBack = () => {
    navigate('/vehicles');
  };

  return (
    <PageWrapper isLoading={isLoading} errorContext="VehicleDetailPage">
      <DataGuard
        data={vehicle}
        emptyComponent={<Typography p={4}>Vehicle not found.</Typography>}
      >
        {(v) => (
          <>
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
                  onClick={() => setInfoDrawerOpen(true)}
                >
                  Edit
                </Button>
              }
              summary={<VehicleKPI vehicle={v} cpm={kpiCpm} monthlyCost={kpiMonthlyTotal} vehicleLoads={vehicleLoads} />}
              tabs={VEHICLE_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            >
              {activeTab === 'overview' && (
                <VehicleOverviewTab
                  vehicle={v}
                  carrierDrivers={carrierDrivers}
                  onOpenInfoDrawer={() => setInfoDrawerOpen(true)}
                />
              )}

              {activeTab === 'expenses' && (
                <VehicleExpenseTab
                  vehicle={v}
                  onOpenTargetsDrawer={() => setTargetsDrawerOpen(true)}
                />
              )}

              {activeTab === 'load-history' && (
                <VehicleLoadHistoryTab
                  vehicleLoads={vehicleLoads}
                  isLoading={loadHistoryLoading}
                />
              )}

              {activeTab === 'documents' && id && (
                <DocumentUpload
                  context="vehicle-detail"
                  entityType="vehicle"
                  entityId={id}
                />
              )}
            </DetailLayout>

            {infoDrawerOpen && (
              <VehicleInfoDrawer
                open={infoDrawerOpen}
                onClose={() => setInfoDrawerOpen(false)}
                data={v}
                onSave={handleDrawerSave}
              />
            )}
            {expenseDrawerOpen && (
              <VehicleExpenseDrawer
                open={expenseDrawerOpen}
                onClose={() => setExpenseDrawerOpen(false)}
                data={v}
                onSave={handleDrawerSave}
              />
            )}
            {targetsDrawerOpen && (
              <VehicleTargetsDrawer
                open={targetsDrawerOpen}
                onClose={() => setTargetsDrawerOpen(false)}
                data={v}
                onSave={handleDrawerSave}
              />
            )}
          </>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default VehicleDetailPage;
