import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { format, parseISO } from 'date-fns';
import { Button, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DirectionsIcon from '@mui/icons-material/Directions';
import { useDispatch, useSelector } from 'store';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import { KpiCell } from 'components/Typography';
import { ContextualAlert } from 'components/ContextualAlert';
import { getPlaceStats } from 'utils/api/places/placeApi';
import type { PlaceStats } from 'utils/api/places/placeApi';
import { selectFormattedPlaceById } from '../../store/selectors/placeSelectors';
import {
  fetchPlaceDetailsRequest,
  placePageSelectors,
} from '../../store/reducers/placePageSlice';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';
import { FACILITY_TYPE_LABELS, DOCK_TYPE_LABELS } from '../../constants';
import type { FacilityType, DockType, Place } from '../../types';
import { OverviewTab } from '../../components/PlaceDetailPage/OverviewTab';
import { LoadHistoryTab } from '../../components/PlaceDetailPage/LoadHistoryTab';
import { NotesTab } from '../../components/PlaceDetailPage/NotesTab';

const PLACE_DETAIL_TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Load History', value: 'loads' },
  { label: 'Notes', value: 'notes' },
] as const;

const buildFullAddress = (p: Place): string => {
  const line1 = [p.address, p.address2].filter(Boolean).join(', ');
  const line2 = [p.city, p.state, p.zip].filter(Boolean).join(', ');
  return [line1, line2].filter(Boolean).join(', ');
};

const buildGoogleMapsUrl = (p: Place): string => {
  const address = buildFullAddress(p);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
};

const buildSpecialInstructions = (p: Place): string | null => {
  const parts: string[] = [];

  if (p.lumperRequired) {
    parts.push('Lumper service is required at this facility.');
  }
  if (p.appointmentRequired) {
    parts.push('Appointment is required before arrival.');
  }
  if (p.ppeRequired) {
    parts.push('PPE is required on-site.');
  }
  if (p.operatingHours) {
    parts.push(`Dock Hours: ${p.operatingHours}`);
  }
  if (p.checkInProcedures) {
    parts.push(p.checkInProcedures);
  }
  if (p.notes) {
    parts.push(p.notes);
  }

  return parts.length > 0 ? parts.join(' | ') : null;
};

const formatLastVisit = (date: string | null): string => {
  if (!date) {
    return '—';
  }
  return format(parseISO(date), 'MMM d, yyyy');
};

const PlaceDetailPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();
  const { id } = useParams();
  const placeSelector = useMemo(() => selectFormattedPlaceById(id), [id]);
  const place = useSelector(placeSelector);
  const isLoading = useSelector(placePageSelectors.selectIsEntityLoading('getById', id ?? ''));
  const isError = useSelector(
    (state) => Boolean(placePageSelectors.selectEntityError('getById', id ?? '')(state)),
  );

  const [placeStats, setPlaceStats] = useState<PlaceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchPlaceDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) {
      return;
    }
    setStatsLoading(true);
    getPlaceStats(id)
      .then(setPlaceStats)
      .catch(() => setPlaceStats(null))
      .finally(() => setStatsLoading(false));
  }, [id]);

  const handleBack = () => {
    navigate('/places');
  };

  const handleEdit = () => {
    if (id) {
      openDrawer('placeInfo', { placeId: id });
    }
  };

  return (
    <PageWrapper isLoading={isLoading} isError={isError} errorContext="PlaceDetailPage">
      <DataGuard data={place} emptyComponent={<Typography p={4}>Place not found.</Typography>}>
        {(p) => {
          const facilityLabel = p.facilityType
            ? FACILITY_TYPE_LABELS[p.facilityType as FacilityType]
            : null;
          const dockLabel = p.dockType ? DOCK_TYPE_LABELS[p.dockType as DockType] : null;
          const fullAddress = buildFullAddress(p);
          const specialInstructions = buildSpecialInstructions(p);

          return (
            <DetailLayout
              id={p.name}
              status={facilityLabel ?? 'Other'}
              breadcrumb={{ label: 'Places', href: '/places' }}
              onBack={handleBack}
              actions={
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DirectionsIcon />}
                    href={buildGoogleMapsUrl(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'common.white',
                      borderColor: 'rgba(255,255,255,0.4)',
                      '&:hover': { borderColor: 'common.white' },
                    }}
                  >
                    Directions
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    sx={{
                      color: 'common.white',
                      borderColor: 'rgba(255,255,255,0.4)',
                      '&:hover': { borderColor: 'common.white' },
                    }}
                  >
                    Edit Place
                  </Button>
                </>
              }
              summary={
                <>
                  <KpiCell label="Address" value={fullAddress || '—'} />
                  <KpiCell label="Facility Type" value={facilityLabel ?? '—'} />
                  <KpiCell
                    label="Appointment"
                    value={p.appointmentRequired ? 'Required' : 'Walk-in'}
                    valueProps={p.appointmentRequired ? { color: 'error.main' } : {}}
                  />
                  <KpiCell label="Dock Type" value={dockLabel ?? '—'} />
                  <KpiCell
                    label="Total Visits"
                    value={statsLoading ? '...' : String(placeStats?.visitCount ?? '—')}
                    sub={`Last: ${statsLoading ? '...' : formatLastVisit(placeStats?.lastVisitDate ?? null)}`}
                  />
                </>
              }
              tabs={PLACE_DETAIL_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            >
              {activeTab === 'overview' && (
                <OverviewTab
                  place={p}
                  placeStats={placeStats}
                  statsLoading={statsLoading}
                  facilityLabel={facilityLabel}
                  dockLabel={dockLabel}
                  fullAddress={fullAddress}
                  specialInstructions={specialInstructions}
                  formatLastVisit={formatLastVisit}
                />
              )}

              {activeTab === 'loads' && <LoadHistoryTab />}

              {activeTab === 'notes' && <NotesTab notes={p.notes} />}
            </DetailLayout>
          );
        }}
      </DataGuard>
    </PageWrapper>
  );
};

export default PlaceDetailPage;
