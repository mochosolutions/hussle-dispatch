import React from 'react';
import { Autocomplete, Box, Chip, TextField, Typography } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';

import type { Driver, Vehicle } from 'features/carrier/types';

import { FLEET_DRIVERS, FLEET_VEHICLES, MOCK_DRIVER_VEHICLE_MAP } from '../../mockData';

interface DriverVehicleAssignmentProps {
  selectedDriverId: string | null;
  onSelectDriver: (driverId: string | null) => void;
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  DRY_VAN: 'Dry Van',
  REEFER: 'Reefer',
  FLATBED: 'Flatbed',
  STEP_DECK: 'Step Deck',
  BOX_TRUCK: 'Box Truck',
  HOTSHOT: 'Hotshot',
  POWER_ONLY: 'Power Only',
};

const filterOptions = createFilterOptions<Driver>({
  stringify: (option) =>
    `${option.name} ${option.currentCity ?? ''} ${option.currentState ?? ''}`,
});

const StatusDot: React.FC<{ available: boolean }> = ({ available }) => (
  <Box
    component="span"
    sx={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      bgcolor: available ? 'success.main' : 'grey.400',
      display: 'inline-block',
      flexShrink: 0,
    }}
  />
);

const DriverVehicleDetail: React.FC<{ driver: Driver; vehicle: Vehicle | undefined }> = ({
  driver,
  vehicle,
}) => (
  <Box
    sx={{
      mt: 1,
      p: 1.5,
      border: 1,
      borderColor: 'divider',
      borderRadius: 1,
      bgcolor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5,
    }}
  >
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {driver.name}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {driver.currentCity ?? '—'}, {driver.currentState ?? '—'}
      {driver.availableHours ? ` \u00B7 ${driver.availableHours} hrs available` : ''}
    </Typography>
    {vehicle && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {vehicle.unitNumber} \u00B7 {vehicle.year} {vehicle.make} {vehicle.model}
        </Typography>
        <Chip
          label={VEHICLE_TYPE_LABELS[vehicle.type] ?? vehicle.type}
          size="small"
          sx={{ height: 20, fontSize: '0.7rem' }}
        />
      </Box>
    )}
  </Box>
);

export const DriverVehicleAssignment: React.FC<DriverVehicleAssignmentProps> = ({
  selectedDriverId,
  onSelectDriver,
}) => {
  const selectedDriver = selectedDriverId
    ? FLEET_DRIVERS.find((d) => d.id === selectedDriverId) ?? null
    : null;

  const pairedVehicleId = selectedDriverId
    ? MOCK_DRIVER_VEHICLE_MAP[selectedDriverId]
    : undefined;

  const pairedVehicle = pairedVehicleId
    ? FLEET_VEHICLES.find((v) => v.id === pairedVehicleId)
    : undefined;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Driver Assignment
      </Typography>

      <Autocomplete
        options={FLEET_DRIVERS}
        value={selectedDriver}
        onChange={(_event, newValue) => {
          onSelectDriver(newValue?.id ?? null);
        }}
        getOptionLabel={(option) => option.name}
        groupBy={(option) => (option.isAvailable ? 'Available' : 'Unavailable')}
        filterOptions={filterOptions}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StatusDot available={option.isAvailable} />
              <Typography variant="body2">
                {option.name} \u00B7 {option.currentCity ?? '—'}, {option.currentState ?? '—'}
              </Typography>
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField {...params} placeholder="Search drivers..." size="small" />
        )}
        size="small"
      />

      {selectedDriver ? (
        <DriverVehicleDetail driver={selectedDriver} vehicle={pairedVehicle} />
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
          Select a driver to assign
        </Typography>
      )}
    </Box>
  );
};
