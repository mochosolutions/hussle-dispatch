import { Avatar, Box, Button, Chip, Stack, Tab, Tabs, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';

import getDriverDisplayName from 'utils/getDriverDisplayName';
import type { Driver } from 'features/carrier/types';
import { DRIVER_TABS } from '../../constants';

interface DriverWithCarrierInfo extends Driver {
  carrierName: string | null;
  carrierType: string | null;
}

interface DriverDetailHeaderProps {
  driver: DriverWithCarrierInfo;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBackClick: () => void;
  onEditClick: () => void;
}

const getInitials = (firstName: string, lastName: string): string =>
  [firstName.charAt(0), lastName.charAt(0)]
    .filter(Boolean)
    .join('')
    .slice(0, 2);

const formatLocation = (city: string | null, state: string | null): string => {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return '\u2014';
};

const KPI_LABELS = [
  'LOCATION',
  'VEHICLE',
  'HOURS AVAILABLE',
  'DAYS OUT',
  'WEEKLY GROSS',
  'LAST DELIVERED',
];

const getKpiValue = (driver: DriverWithCarrierInfo, label: string): string => {
  if (label === 'LOCATION') return formatLocation(driver.currentCity, driver.currentState);
  if (label === 'HOURS AVAILABLE') {
    return driver.availableHours ? `${driver.availableHours}h` : '\u2014';
  }
  return '\u2014';
};

export const DriverDetailHeader: React.FC<DriverDetailHeaderProps> = ({
  driver: d,
  activeTab,
  onTabChange,
  onBackClick,
  onEditClick,
}) => (
  <Box
    sx={{
      px: 4,
      pt: 2,
      bgcolor: 'background.paper',
      borderBottom: 1,
      borderColor: 'divider',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBackClick}
          size="small"
          sx={{ color: 'primary.main' }}
        >
          Drivers
        </Button>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.light',
            color: 'primary.main',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {getInitials(d.firstName, d.lastName)}
        </Avatar>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5">{getDriverDisplayName(d)}</Typography>
            <Chip
              label={d.isAvailable ? 'Available' : 'Unavailable'}
              size="small"
              color={d.isAvailable ? 'success' : 'default'}
              sx={{ height: 22, fontSize: '0.75rem' }}
            />
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            {d.carrierName && (
              <Chip
                label={d.carrierName}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
            {d.carrierType && (
              <Chip
                label={d.carrierType}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Stack>
        </Box>
      </Box>
      <Button variant="outlined" startIcon={<EditIcon />} onClick={onEditClick}>
        Edit
      </Button>
    </Box>

    {/* KPI Strip */}
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'grey.50',
      }}
    >
      {KPI_LABELS.map((label, i) => (
        <Box
          key={label}
          sx={{
            px: 2.5,
            py: 1.5,
            borderRight: i < 5 ? 1 : 0,
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: 'text.disabled',
              fontSize: '0.625rem',
            }}
          >
            {label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
            {getKpiValue(d, label)}
          </Typography>
        </Box>
      ))}
    </Box>

    {/* Tabs */}
    <Box sx={{ mt: 1 }}>
      <Tabs
        value={activeTab}
        onChange={(_event, value: string) => onTabChange(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ minHeight: 44 }}
      >
        {DRIVER_TABS.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} sx={{ minHeight: 44 }} />
        ))}
      </Tabs>
    </Box>
  </Box>
);
