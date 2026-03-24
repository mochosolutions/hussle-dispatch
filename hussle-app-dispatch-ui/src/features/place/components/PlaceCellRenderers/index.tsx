import { Box, Chip, Typography } from '@mui/material';
import type { ICellRendererParams } from 'ag-grid-community';
import type { ChipColor } from 'types/chipColor';
import { TwoLineCell } from 'components/Typography';
import type { PlaceListItem, FacilityType, DockType } from '../../types';
import { FACILITY_TYPE_LABELS, DOCK_TYPE_LABELS } from '../../constants';

const facilityTypeColor: Record<FacilityType, ChipColor> = {
  WAREHOUSE: 'default',
  DISTRIBUTION_CENTER: 'primary',
  MANUFACTURING: 'secondary',
  COLD_STORAGE: 'info',
  CROSS_DOCK: 'warning',
  PORT: 'success',
  RAIL_YARD: 'default',
  DROP_YARD: 'default',
  OTHER: 'default',
};

export const PlaceNameCellRenderer = (params: ICellRendererParams<PlaceListItem>) => {
  if (!params.data) {
    return null;
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {params.data.name}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {[params.data.city, params.data.state].filter(Boolean).join(', ')}
      </Typography>
    </Box>
  );
};

export const PlaceFacilityTypeCellRenderer = (params: ICellRendererParams<PlaceListItem>) => {
  if (!params.data?.facilityType) {
    return <Typography variant="body2" sx={{ color: 'text.disabled' }}>--</Typography>;
  }
  const { facilityType } = params.data;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <Chip
        label={FACILITY_TYPE_LABELS[facilityType]}
        size="small"
        color={facilityTypeColor[facilityType]}
        variant="outlined"
      />
    </Box>
  );
};

export const PlaceVisitsCellRenderer = (params: ICellRendererParams<PlaceListItem>) => {
  if (!params.data) {
    return null;
  }
  const visitCount = (params.data as PlaceListItem & { visitCount?: number }).visitCount;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography
        variant="body2"
        sx={{ fontVariantNumeric: 'tabular-nums', color: visitCount ? 'text.primary' : 'text.disabled' }}
      >
        {visitCount ?? '\u2014'}
      </Typography>
    </Box>
  );
};

export const PlaceLumperCellRenderer = (params: ICellRendererParams<PlaceListItem>) => {
  if (!params.data?.lumperRequired) {
    return null;
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <Chip label="Lumper" size="small" color="warning" variant="outlined" />
    </Box>
  );
};

export const PlaceContactCellRenderer = (params: ICellRendererParams<PlaceListItem>) => {
  if (!params.data) {
    return null;
  }
  const { contactName, contactPhone } = params.data;
  if (!contactName && !contactPhone) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>{'\u2014'}</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <TwoLineCell
        primary={contactName ?? '\u2014'}
        secondary={contactPhone ?? ''}
      />
    </Box>
  );
};

export const PlaceAppointmentCellRenderer = (params: ICellRendererParams<PlaceListItem>) => {
  if (!params.data) {
    return null;
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <Chip
        label={params.data.appointmentRequired ? 'Required' : 'Walk-in'}
        size="small"
        color={params.data.appointmentRequired ? 'error' : 'default'}
        variant="outlined"
      />
    </Box>
  );
};

export const PlaceDockTypeCellRenderer = (params: ICellRendererParams<PlaceListItem>) => {
  if (!params.data?.dockType) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>{'\u2014'}</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <Typography variant="body2">{DOCK_TYPE_LABELS[params.data.dockType as DockType]}</Typography>
    </Box>
  );
};
