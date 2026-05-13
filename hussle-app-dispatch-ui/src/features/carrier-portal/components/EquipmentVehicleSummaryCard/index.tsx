import { Avatar, Box, IconButton, Stack } from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, LocalShipping as LocalShippingIcon } from '@mui/icons-material';

import { MetaStrong, Timestamp } from 'components/Typography';
import { VehicleCategory } from 'features/carrier-portal/types';
import type { VehicleEntry } from 'features/carrier-portal/types';

interface EquipmentVehicleSummaryCardProps {
  vehicle: VehicleEntry;
  onEdit: () => void;
  onRemove: () => void;
}

const CATEGORY_LABEL: Record<VehicleCategory, string> = {
  [VehicleCategory.SEMI_TRUCK]: 'Semi Truck',
  [VehicleCategory.BOX_TRUCK]: 'Box Truck',
  [VehicleCategory.CARGO_VAN]: 'Cargo Van',
  [VehicleCategory.PERSONAL_VEHICLE]: 'Personal Vehicle',
};

const EquipmentVehicleSummaryCard: React.FC<EquipmentVehicleSummaryCardProps> = ({
  vehicle,
  onEdit,
  onRemove,
}) => {
  const categoryLabel = CATEGORY_LABEL[vehicle.category];
  const titleParts = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
  const title = titleParts || categoryLabel;
  const details = [
    titleParts ? categoryLabel : undefined,
    vehicle.vin ? `VIN …${vehicle.vin.slice(-6)}` : undefined,
    vehicle.licensePlate,
    vehicle.gvwr ? `${vehicle.gvwr.toLocaleString()} lbs GVWR` : undefined,
  ].filter(Boolean);

  return (
    <Box
      onClick={onEdit}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1.5,
        px: 2,
        bgcolor: 'grey.100',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        cursor: 'pointer',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: 'grey.50' },
        '&:hover .summary-actions': { opacity: 1 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'grey.200', borderRadius: 1 }}>
          <LocalShippingIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </Avatar>
        <Box>
          <MetaStrong sx={{ color: 'text.primary' }}>{title}</MetaStrong>
          {details.length > 0 ? <Timestamp>{details.join(' · ')}</Timestamp> : null}
        </Box>
      </Box>
      <Stack
        direction="row"
        spacing={0.5}
        className="summary-actions"
        sx={{ opacity: 0, transition: 'opacity 0.15s' }}
      >
        <IconButton
          size="small"
          aria-label="Edit vehicle"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          aria-label="Remove vehicle"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          sx={{ color: 'error.main' }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default EquipmentVehicleSummaryCard;
