import React from 'react';
import { Avatar, Box, Chip } from '@mui/material';
import getDriverDisplayName from 'utils/getDriverDisplayName';

import type { MockDriver } from '../../types';

export interface DriverFilterStripProps {
  drivers: MockDriver[];
  selectedDriverId: string | null;
  onSelectDriver: (driverId: string | null) => void;
}

const DriverFilterStrip: React.FC<DriverFilterStripProps> = ({
  drivers,
  selectedDriverId,
  onSelectDriver,
}) => {
  const isAllSelected = selectedDriverId === null;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        overflowX: 'auto',
        py: 1,
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
      }}
    >
      <Chip
        label={`All Empty Drivers (${drivers.length})`}
        color={isAllSelected ? 'primary' : 'default'}
        variant={isAllSelected ? 'filled' : 'outlined'}
        onClick={() => onSelectDriver(null)}
        sx={{ fontWeight: isAllSelected ? 600 : 400, flexShrink: 0 }}
      />
      {drivers.map((driver) => {
        const isSelected = selectedDriverId === driver.id;

        return (
          <Chip
            key={driver.id}
            avatar={
              <Avatar sx={{ bgcolor: driver.avatarColor, width: 24, height: 24, fontSize: 12 }}>
                {driver.initials}
              </Avatar>
            }
            label={`${driver.name} · ${driver.currentCity}, ${driver.currentState}`}
            color={isSelected ? 'primary' : 'default'}
            variant={isSelected ? 'filled' : 'outlined'}
            onClick={() => onSelectDriver(driver.id)}
            sx={{ fontWeight: isSelected ? 600 : 400, flexShrink: 0 }}
          />
        );
      })}
    </Box>
  );
};

export default DriverFilterStrip;
