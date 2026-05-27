import { Box, CircularProgress, Grid } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { BodyMuted, BodyStrong, KpiLabel } from 'components/Typography';
import type { PlaceStats } from 'utils/api/places/placeApi';
import type { Place, FacilityType, DockType } from '../../types';
import { FACILITY_TYPE_LABELS, DOCK_TYPE_LABELS } from '../../constants';

interface PlaceKPIProps {
  place: Place;
  stats?: PlaceStats | null;
  statsLoading?: boolean;
}

const LABEL_SX = { minWidth: 80, flexShrink: 0 } as const;
const EM_DASH = '—';

const buildFullAddress = (p: Place): string => {
  const line1 = [p.address, p.address2].filter(Boolean).join(', ');
  const line2 = [p.city, p.state, p.zip].filter(Boolean).join(', ');
  return [line1, line2].filter(Boolean).join(', ');
};

const formatLastVisit = (date: string | null): string => {
  if (!date) {
    return EM_DASH;
  }
  return format(parseISO(date), 'MMM d, yyyy');
};

interface KpiRowProps {
  label: string;
  value: string;
  color?: string;
}

const KpiRow: React.FC<KpiRowProps> = ({ label, value, color }) => (
  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
    <BodyMuted sx={LABEL_SX}>{label}</BodyMuted>
    <BodyStrong sx={{ lineHeight: 1.3, color: color ?? 'text.primary' }}>{value}</BodyStrong>
  </Box>
);

export const PlaceKPI: React.FC<PlaceKPIProps> = ({ place, stats, statsLoading }) => {
  const facilityLabel = place.facilityType
    ? FACILITY_TYPE_LABELS[place.facilityType as FacilityType]
    : null;
  const dockLabel = place.dockType ? DOCK_TYPE_LABELS[place.dockType as DockType] : null;
  const fullAddress = buildFullAddress(place);

  return (
    <Grid container spacing={2}>
      {/* Column 1 — Facility Info */}
      <Grid item sm={6} md={6}>
        <KpiLabel sx={{ mb: 0.5 }}>Facility Info</KpiLabel>
        <KpiRow label="Address:" value={fullAddress || EM_DASH} />
        <KpiRow label="Facility:" value={facilityLabel ?? EM_DASH} />
        <KpiRow label="Dock:" value={dockLabel ?? EM_DASH} />
        <KpiRow
          label="Appt:"
          value={place.appointmentRequired ? 'Required' : 'Walk-in'}
          color={place.appointmentRequired ? 'error.main' : undefined}
        />
      </Grid>

      {/* Column 2 — Visit Stats */}
      <Grid item sm={6} md={6}>
        <KpiLabel sx={{ mb: 0.5 }}>Visit Stats</KpiLabel>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
          <BodyMuted sx={LABEL_SX}>Total:</BodyMuted>
          {statsLoading ? (
            <CircularProgress size={12} />
          ) : (
            <BodyStrong sx={{ lineHeight: 1.3 }}>
              {stats?.visitCount !== undefined ? String(stats.visitCount) : EM_DASH}
            </BodyStrong>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
          <BodyMuted sx={LABEL_SX}>Last Visit:</BodyMuted>
          {statsLoading ? (
            <CircularProgress size={12} />
          ) : (
            <BodyStrong sx={{ lineHeight: 1.3 }}>
              {formatLastVisit(stats?.lastVisitDate ?? null)}
            </BodyStrong>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};
