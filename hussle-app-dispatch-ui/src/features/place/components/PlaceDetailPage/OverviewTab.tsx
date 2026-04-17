import { Grid, Stack } from '@mui/material';
import { DetailRow } from 'components/Typography';
import SectionCard from 'components/SectionCard';
import { ContextualAlert } from 'components/ContextualAlert';
import type { PlaceStats } from 'utils/api/places/placeApi';
import type { Place } from '../../../types';

interface OverviewTabProps {
  place: Place;
  placeStats: PlaceStats | null;
  statsLoading: boolean;
  facilityLabel: string | null;
  dockLabel: string | null;
  fullAddress: string;
  specialInstructions: string | null;
  formatLastVisit: (date: string | null) => string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  place,
  placeStats,
  statsLoading,
  facilityLabel,
  dockLabel,
  fullAddress,
  specialInstructions,
  formatLastVisit,
}) => (
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
            <DetailRow label="Place Name" value={place.name} />
            <DetailRow label="Facility Type" value={facilityLabel ?? '—'} />
            <DetailRow label="Address" value={fullAddress || '—'} />
            <DetailRow label="Dock Type" value={dockLabel ?? '—'} />
            <DetailRow
              label="Appointment"
              value={place.appointmentRequired ? 'Required' : 'Walk-in'}
              valueColor={place.appointmentRequired ? 'error.main' : undefined}
            />
            <DetailRow
              label="Lumper Required"
              value={place.lumperRequired ? 'Yes' : 'No'}
              valueColor={place.lumperRequired ? 'warning.main' : undefined}
            />
            <DetailRow label="Dock Hours" value={place.operatingHours ?? '—'} />
            <DetailRow label="Gate Code" value={place.checkInProcedures ?? '—'} noBorder />
          </SectionCard>

          <SectionCard title="On-Site Contact">
            <DetailRow label="Contact Name" value={place.contactName ?? '—'} />
            <DetailRow label="Phone" value={place.contactPhone ?? '—'} />
            <DetailRow label="Email" value={place.contactEmail ?? '—'} noBorder />
          </SectionCard>
        </Stack>
      </Grid>

      <Grid item xs={12} md={4}>
        <SectionCard title="Visit Stats">
          <DetailRow
            label="Total Visits"
            value={statsLoading ? '...' : String(placeStats?.visitCount ?? '—')}
          />
          <DetailRow label="Avg Wait Time" value="—" />
          <DetailRow
            label="Last Visit"
            value={statsLoading ? '...' : formatLastVisit(placeStats?.lastVisitDate ?? null)}
            noBorder
          />
        </SectionCard>
      </Grid>
    </Grid>
  </Stack>
);

export default OverviewTab;
