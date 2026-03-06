import { Avatar, Box, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { EQUIPMENT_OPTIONS } from '../../constants';
import type { DriverFormEntry, VehicleFormEntry } from '../../types';

interface VehicleSummaryCardProps {
  vehicle: VehicleFormEntry;
  drivers: DriverFormEntry[];
  onEdit: () => void;
  onRemove: () => void;
}

export const VehicleSummaryCard = ({
  vehicle,
  drivers,
  onEdit,
  onRemove,
}: VehicleSummaryCardProps) => {
  const assigned = drivers.find((d) => d.localId === vehicle.assignedDriverLocalId);
  const eqLabel = EQUIPMENT_OPTIONS.find((e) => e.value === vehicle.type)?.label;
  const details = [
    vehicle.vin && `VIN …${vehicle.vin.slice(-6)}`,
    eqLabel,
    vehicle.licensePlate,
    assigned && `→ ${assigned.firstName}`,
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
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {details.join(' · ')}
          </Typography>
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
