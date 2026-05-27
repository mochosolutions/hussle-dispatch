import { Box } from '@mui/material';
import { StatusBadge } from 'components/Statusbadge';
import type { Vehicle } from 'features/carrier/types';

export const VehicleStatusCellRenderer = ({ data }: { data: Vehicle }) => {
  const status = data.isActive ? 'VEHICLE_ACTIVE' : 'VEHICLE_INACTIVE';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <StatusBadge status={status} size="small" />
    </Box>
  );
};
