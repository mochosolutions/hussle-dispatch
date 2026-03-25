import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import { CarrierKPI } from '../../components/CarrierKPI';
import { getCarrierStats } from 'utils/api/fleet/carrierApi';
import type { CarrierStats } from 'utils/api/fleet/carrierApi';
import { CARRIER_DETAIL_TAB_ITEMS } from '../../constants';
import { selectFormattedCarrierById } from '../../store/selectors/carrierSelectors';
import {
  fetchCarrierDetailsRequest,
  carrierPageSelectors,
} from '../../store/reducers/carrierNewPageSlice';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';
import {
  GeneralTab,
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
  const carrierSelector = useMemo(() => selectFormattedCarrierById(id), [id]);
  const carrier = useSelector(carrierSelector);
  const isLoading = useSelector(carrierPageSelectors.selectIsEntityLoading('getById', id ?? ''));
  const isError = useSelector(
    (state) => !!carrierPageSelectors.selectEntityError('getById', id ?? '')(state),
  );

  const [carrierStats, setCarrierStats] = useState<CarrierStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchCarrierDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) {
      return;
    }
    setStatsLoading(true);
    getCarrierStats(id)
      .then(setCarrierStats)
      .catch(() => setCarrierStats(null))
      .finally(() => setStatsLoading(false));
  }, [id]);

  const handleBack = () => {
    navigate('/carriers');
  };

  return (
    <PageWrapper isLoading={isLoading} isError={isError} errorContext="CarrierDetailPage">
      <DataGuard data={carrier} emptyComponent={<Typography p={4}>Carrier not found.</Typography>}>
        {(c) => (
          <DetailLayout
            id={c.name}
            status={`CARRIER_${c.status ?? 'DRAFT'}`}
            breadcrumb={{ label: 'Carriers', href: '/carriers' }}
            onBack={handleBack}
            summary={<CarrierKPI c={c} stats={carrierStats} statsLoading={statsLoading} />}
            tabs={CARRIER_DETAIL_TAB_ITEMS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {c.driverCount === 0 && c.vehicleCount === 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Get started by adding your first driver and vehicle.
              </Alert>
            )}

            {activeTab === 'general' && id && (
              <GeneralTab
                carrier={c}
                onEditCompanyInfo={() => openDrawer('carrierCompanyInfo', { carrierId: id })}
                onEditTerms={() => openDrawer('carrierDispatchTerms', { carrierId: id })}
              />
            )}

            {activeTab === 'drivers' && id && <DriversTab carrierId={id} />}

            {activeTab === 'vehicles' && id && <VehiclesTab carrierId={id} />}

            {activeTab === 'loadHistory' && id && <LoadHistoryTab carrierId={id} />}

            {activeTab === 'documents' && id && <DocumentsTab carrierId={id} />}

            {activeTab === 'notes' && id && <NotesTab carrierId={id} />}
          </DetailLayout>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default CarrierDetailEditable;
