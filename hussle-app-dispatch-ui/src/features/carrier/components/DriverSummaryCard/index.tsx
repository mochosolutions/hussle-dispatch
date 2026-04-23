import { Avatar, Box, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import type { DriverFormEntry } from '../../types';
import formatPhone from 'utils/formatPhone';

interface DriverSummaryCardProps {
  driver: DriverFormEntry;
  onEdit: () => void;
  onRemove: () => void;
}

export const DriverSummaryCard = ({ driver, onEdit, onRemove }: DriverSummaryCardProps) => {
  const displayName = getDriverDisplayName(driver);
  const initials = [driver.firstName.charAt(0), driver.lastName.charAt(0)]
    .filter(Boolean)
    .join('')
    .toUpperCase();

  const details = [driver.licenseNumber, formatPhone(driver.phone)].filter(Boolean);

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
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.light',
            color: 'primary.main',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {initials}
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {displayName}
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
          aria-label="Edit driver"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          aria-label="Remove driver"
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
