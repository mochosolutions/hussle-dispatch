import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, Grid, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DirectionsIcon from '@mui/icons-material/Directions';
import { useDispatch, useSelector } from 'store';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import { KpiCell, DetailRow } from 'components/Typography';
import SectionCard from 'components/SectionCard';
import { ContextualAlert } from 'components/ContextualAlert';
import { selectFormattedPlaceById } from '../../store/selectors/placeSelectors';
import {
  fetchPlaceDetailsRequest,
  placePageSelectors,
} from '../../store/reducers/placePageSlice';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';
import { FACILITY_TYPE_LABELS, DOCK_TYPE_LABELS } from '../../constants';
import type { FacilityType, DockType, Place } from '../../types';

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

  useEffect(() => {
    if (id) {
      dispatch(fetchPlaceDetailsRequest({ id }));
    }
  }, [dispatch, id]);

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
                  <KpiCell label="Address" value={fullAddress || '\u2014'} />
                  <KpiCell label="Facility Type" value={facilityLabel ?? '\u2014'} />
                  <KpiCell
                    label="Appointment"
                    value={p.appointmentRequired ? 'Required' : 'Walk-in'}
                    valueProps={p.appointmentRequired ? { color: 'error.main' } : {}}
                  />
                  <KpiCell label="Dock Type" value={dockLabel ?? '\u2014'} />
                  <KpiCell label="Total Visits" value="\u2014" sub="Avg wait: \u2014" />
                </>
              }
              tabs={PLACE_DETAIL_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            >
              {activeTab === 'overview' && (
                <Stack spacing={2.5}>
                  {specialInstructions && (
                    <ContextualAlert
                      severity="warning"
                      title="Special Instructions"
                      description={specialInstructions}
                    />
                  )}

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} md={8}>
                      <Stack spacing={2.5}>
                        <SectionCard title="Facility Details">
                          <DetailRow label="Place Name" value={p.name} />
                          <DetailRow
                            label="Facility Type"
                            value={facilityLabel ?? '\u2014'}
                          />
                          <DetailRow label="Address" value={fullAddress || '\u2014'} />
                          <DetailRow label="Dock Type" value={dockLabel ?? '\u2014'} />
                          <DetailRow
                            label="Appointment"
                            value={p.appointmentRequired ? 'Required' : 'Walk-in'}
                            valueColor={p.appointmentRequired ? 'error.main' : undefined}
                          />
                          <DetailRow
                            label="Lumper Required"
                            value={p.lumperRequired ? 'Yes' : 'No'}
                            valueColor={p.lumperRequired ? 'warning.main' : undefined}
                          />
                          <DetailRow
                            label="Dock Hours"
                            value={p.operatingHours ?? '\u2014'}
                          />
                          <DetailRow
                            label="Gate Code"
                            value={p.checkInProcedures ?? '\u2014'}
                            noBorder
                          />
                        </SectionCard>

                        <SectionCard title="On-Site Contact">
                          <DetailRow label="Contact Name" value={p.contactName ?? '\u2014'} />
                          <DetailRow label="Phone" value={p.contactPhone ?? '\u2014'} />
                          <DetailRow
                            label="Email"
                            value={p.contactEmail ?? '\u2014'}
                            noBorder
                          />
                        </SectionCard>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <SectionCard title="Visit Stats">
                        <DetailRow label="Total Loads" value="\u2014" />
                        <DetailRow label="Avg Wait Time" value="\u2014" />
                        <DetailRow label="Last Visit" value="\u2014" noBorder />
                      </SectionCard>
                    </Grid>
                  </Grid>
                </Stack>
              )}

              {activeTab === 'loads' && (
                <SectionCard title="Load History">
                  <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No loads have been assigned to this facility yet.
                    </Typography>
                  </Stack>
                </SectionCard>
              )}

              {activeTab === 'notes' && (
                <SectionCard title="Notes">
                  <Typography
                    variant="body2"
                    sx={{
                      color: p.notes ? 'text.primary' : 'text.disabled',
                      whiteSpace: 'pre-wrap',
                      p: 1,
                    }}
                  >
                    {p.notes || 'No notes added.'}
                  </Typography>
                </SectionCard>
              )}
            </DetailLayout>
          );
        }}
      </DataGuard>
    </PageWrapper>
  );
};

export default PlaceDetailPage;
