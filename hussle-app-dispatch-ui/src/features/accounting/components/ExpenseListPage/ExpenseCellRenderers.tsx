import { Box, Chip } from '@mui/material';
import { Amount, Body } from 'components/Typography';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS = [
  { value: 'FUEL', label: 'Fuel' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'TOLLS', label: 'Tolls' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'MEALS', label: 'Meals' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'TRUCK_PAYMENT', label: 'Truck Payment' },
  { value: 'TRAILER_RENTAL', label: 'Trailer Rental' },
  { value: 'PERMITS_TAGS', label: 'Permits & Tags' },
  { value: 'SCALES', label: 'Scales' },
  { value: 'LUMPER', label: 'Lumper' },
  { value: 'TIRES', label: 'Tires' },
  { value: 'OIL_CHANGE', label: 'Oil Change' },
  { value: 'DEF_FLUID', label: 'DEF Fluid' },
  { value: 'TRUCK_WASH', label: 'Truck Wash' },
];

export const CATEGORY_LABEL_MAP: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
);

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

export const DateCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    <Body>{value}</Body>
  </Box>
);

export const CurrencyCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    <Amount>{value}</Amount>
  </Box>
);

export const CategoryCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    <Chip label={CATEGORY_LABEL_MAP[value] ?? value} size="small" variant="outlined" />
  </Box>
);
