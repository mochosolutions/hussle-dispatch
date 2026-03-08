import React from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import type { Vehicle } from 'features/carrier/types';

interface VehiclePageHeaderProps {
  vehicle: Vehicle;
  subtitle?: string;
  carrierName?: string;
  carrierType?: string;
  onEdit: () => void;
}

const VehiclePageHeader: React.FC<VehiclePageHeaderProps> = ({
  vehicle,
  subtitle,
  carrierName,
  carrierType,
  onEdit,
}) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        px: { xs: 2, sm: 3 },
        py: 1.75,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={1.5}
      >
        <Stack spacing={0.75}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: 'wrap' }}
          >
            <Button
              variant="text"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/vehicles')}
              sx={{ minWidth: 0, px: 0, color: 'text.secondary' }}
            >
              Vehicles
            </Button>
            <Typography variant="h4" color="text.primary">
              {vehicle.unitNumber}
            </Typography>
            {carrierName && (
              <Chip
                label={carrierName}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {carrierType && (
              <Chip
                label={carrierType}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Stack>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
          }}
        >
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<EditIcon />}
            onClick={onEdit}
          >
            Edit
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default VehiclePageHeader;
