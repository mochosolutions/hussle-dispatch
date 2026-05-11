import { useState, useEffect, useMemo, lazy } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Stack } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import Loadable from 'mocho/components/Loadable';
import { DetailLayout } from 'components/DetailLayout';
import { BodyMuted } from 'components/Typography';
import { CarrierKPI } from '../../components/CarrierKPI';
import { InviteCarrierButton } from '../../components/InviteCarrierButton';
import { AdminActivateButton } from '../../components/AdminActivateButton';
import { CARRIER_DETAIL_TAB_ITEMS } from '../../constants';
import {
  selectFormattedCarrierById,
  selectCarrierStats,
  selectCarrierStatsLoading,
} from '../../store/selectors/carrierSelectors';
import {
  fetchCarrierDetailsRequest,
  fetchCarrierStatsRequest,
  carrierPageSelectors,
} from '../../store/reducers/carrierNewPageSlice';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';

const GeneralTab = Loadable(
  lazy(() =>
    import('../../components/CarrierDetailPage/GeneralTab').then((m) => ({
      default: m.GeneralTab,
    })),
  ),
);
const DriversTab = Loadable(
  lazy(() =>
    import('../../components/CarrierDetailPage/DriversTab').then((m) => ({
      default: m.DriversTab,
    })),
  ),
);
const VehiclesTab = Loadable(
  lazy(() =>
    import('../../components/CarrierDetailPage/VehiclesTab').then((m) => ({
      default: m.VehiclesTab,
    })),
  ),
);
const LoadHistoryTab = Loadable(
  lazy(() =>
    import('../../components/CarrierDetailPage/LoadHistoryTab').then((m) => ({
      default: m.LoadHistoryTab,
    })),
  ),
);
const DocumentsTab = Loadable(
  lazy(() =>
    import('../../components/CarrierDetailPage/DocumentsTab').then((m) => ({
      default: m.DocumentsTab,
    })),
  ),
);
const NotesTab = Loadable(
  lazy(() =>
    import('../../components/CarrierDetailPage/NotesTab').then((m) => ({ default: m.NotesTab })),
  ),
);
const OnboardingTab = Loadable(
  lazy(() =>
    import('../../components/CarrierDetailPage/OnboardingTab').then((m) => ({
      default: m.OnboardingTab,
    })),
  ),
);

const CarrierDetailEditable: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();
  const { id } = useParams();
  const carrierSelector = useMemo(() => selectFormattedCarrierById(id), [id]);
  const carrier = useSelector(carrierSelector);
  const isError = useSelector(
    (state) => !!carrierPageSelectors.selectEntityError('getById', id ?? '')(state),
  );

  console.log('Carrier', { carrier, isError });

  const carrierStats = useSelector(selectCarrierStats);
  const statsLoading = useSelector(selectCarrierStatsLoading);

  useEffect(() => {
    if (id) {
      dispatch(fetchCarrierDetailsRequest({ id }));
      dispatch(fetchCarrierStatsRequest({ id }));
    }
  }, [dispatch, id]);

  const handleBack = () => {
    navigate('/carriers');
  };

  return (
    <PageWrapper isError={isError} errorContext="CarrierDetailPage">
      <DataGuard
        data={carrier}
        emptyComponent={<BodyMuted sx={{ p: 4 }}>Carrier not found.</BodyMuted>}
      >
        {(c) => (
          <DetailLayout
            id={c.name}
            status={`CARRIER_${c.status ?? 'DRAFT'}`}
            breadcrumb={{ label: 'Carriers', href: '/carriers' }}
            onBack={handleBack}
            actions={
              <Stack direction="row" spacing={1}>
                <InviteCarrierButton
                  carrierId={c.id}
                  carrierName={c.name}
                  carrierEmail={c.email}
                  onboardingStatus={c.status}
                />
                <AdminActivateButton carrierId={c.id} carrierName={c.name} status={c.status} />
              </Stack>
            }
            summary={<CarrierKPI c={c} stats={carrierStats} statsLoading={statsLoading} />}
            tabs={
              c.status !== 'DRAFT'
                ? [...CARRIER_DETAIL_TAB_ITEMS, { value: 'onboarding', label: 'Onboarding' }]
                : CARRIER_DETAIL_TAB_ITEMS
            }
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

            {activeTab === 'onboarding' && id && (
              <OnboardingTab
                carrierId={id}
                carrierName={c.name}
                onStatusChanged={() => dispatch(fetchCarrierDetailsRequest({ id }))}
              />
            )}
          </DetailLayout>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default CarrierDetailEditable;
