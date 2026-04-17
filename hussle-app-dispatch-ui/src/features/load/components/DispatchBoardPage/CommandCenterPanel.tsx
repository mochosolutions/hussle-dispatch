import { useMemo } from 'react';
import { Box, Button, Chip, Divider, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'store';

import type { Driver } from 'features/carrier/types';
import type { StagedLoad } from '../../../types';
import { toggleCommandCenterLayer } from '../../../store/reducers';
import { selectCommandCenterLayers } from '../../../store/selectors/loadSelectors';

// ---------------------------------------------------------------------------
// Haversine distance (miles)
// ---------------------------------------------------------------------------

const EARTH_RADIUS_MI = 3959;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const NEARBY_RADIUS_MI = 150;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PanelMode = 'roster' | 'driver-detail' | 'load-detail';

interface CommandCenterPanelProps {
  mode: PanelMode;
  drivers: Driver[];
  feedLoads: StagedLoad[];
  selectedDriverId: string | null;
  selectedLoadId: string | null;
  onSelectDriver: (id: string) => void;
  onSelectLoad: (id: string) => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Roster view
// ---------------------------------------------------------------------------

const DriverRoster: React.FC<{
  drivers: Driver[];
  onSelectDriver: (id: string) => void;
}> = ({ drivers = [], onSelectDriver }) => {
  const available = drivers.filter((d) => d.isAvailable);
  const busy = drivers.filter((d) => !d.isAvailable);

  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ px: 2, pt: 1.5 }}>
        Drivers ({available.length} available, {busy.length} busy)
      </Typography>

      {available.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {available.map((driver) => (
            <Box
              key={driver.id}
              onClick={() => onSelectDriver(driver.id)}
              sx={{
                px: 2,
                py: 1.25,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background-color 0.15s',
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {driver.firstName} {driver.lastName}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                {(driver.currentCity || driver.currentState) && (
                  <Typography variant="caption" color="text.secondary">
                    {[driver.currentCity, driver.currentState].filter(Boolean).join(', ')}
                  </Typography>
                )}
                {driver.availableHours && (
                  <Typography variant="caption" color="text.secondary">
                    {driver.availableHours}h
                  </Typography>
                )}
                <Chip label="Available" size="small" color="success" sx={{ height: 20, fontSize: '0.6875rem' }} />
              </Stack>
            </Box>
          ))}
        </Box>
      )}

      {busy.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Divider sx={{ mx: 2 }} />
          <Typography variant="overline" color="text.secondary" sx={{ px: 2, pt: 1 }}>
            Busy
          </Typography>
          {busy.map((driver) => (
            <Box
              key={driver.id}
              onClick={() => onSelectDriver(driver.id)}
              sx={{
                px: 2,
                py: 1.25,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background-color 0.15s',
              }}
            >
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                {driver.firstName} {driver.lastName}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                {(driver.currentCity || driver.currentState) && (
                  <Typography variant="caption" color="text.disabled">
                    {[driver.currentCity, driver.currentState].filter(Boolean).join(', ')}
                  </Typography>
                )}
                <Chip label="Unavailable" size="small" color="default" sx={{ height: 20, fontSize: '0.6875rem' }} />
              </Stack>
            </Box>
          ))}
        </Box>
      )}

      {drivers.length === 0 && (
        <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.disabled">
            No drivers loaded
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Driver detail view
// ---------------------------------------------------------------------------

const DriverDetailPanel: React.FC<{
  driver: Driver;
  feedLoads: StagedLoad[];
  onSelectLoad: (id: string) => void;
  onBack: () => void;
}> = ({ driver, feedLoads, onSelectLoad, onBack }) => {
  const nearbyLoads = useMemo(() => {
    if (
      typeof driver.currentLatitude !== 'number' ||
      typeof driver.currentLongitude !== 'number'
    ) {
      return [];
    }
    return feedLoads
      .filter(
        (load) =>
          typeof load.originLat === 'number' && typeof load.originLng === 'number',
      )
      .map((load) => ({
        load,
        distance: haversineDistance(
          driver.currentLatitude as number,
          driver.currentLongitude as number,
          load.originLat as number,
          load.originLng as number,
        ),
      }))
      .filter((item) => item.distance <= NEARBY_RADIUS_MI)
      .sort((a, b) => a.distance - b.distance);
  }, [driver, feedLoads]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1 }}>
        <IconButton size="small" onClick={onBack} aria-label="Back to roster">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" fontWeight={700}>
          {driver.firstName} {driver.lastName}
        </Typography>
      </Stack>
      <Divider />

      <Box sx={{ px: 2, py: 1.5 }}>
        {(driver.currentCity || driver.currentState) && (
          <Typography variant="body2" color="text.secondary">
            {[driver.currentCity, driver.currentState].filter(Boolean).join(', ')}
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          {driver.licenseType && (
            <Typography variant="caption" color="text.secondary">
              {driver.licenseType}
            </Typography>
          )}
          {driver.availableHours && (
            <Typography variant="caption" color="text.secondary">
              {driver.availableHours}h available
            </Typography>
          )}
        </Stack>
        <Chip
          label={driver.isAvailable ? 'Available' : 'Unavailable'}
          size="small"
          color={driver.isAvailable ? 'success' : 'default'}
          sx={{ mt: 1, height: 22 }}
        />
      </Box>

      <Divider />
      <Typography variant="overline" color="text.secondary" sx={{ px: 2, pt: 1.5 }}>
        Nearby Loads ({nearbyLoads.length})
      </Typography>

      {nearbyLoads.length === 0 && (
        <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.disabled">
            No loads within {NEARBY_RADIUS_MI} miles
          </Typography>
        </Box>
      )}

      {nearbyLoads.map(({ load, distance }) => (
        <Box
          key={load.id}
          onClick={() => onSelectLoad(load.id)}
          sx={{
            px: 2,
            py: 1.25,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
            transition: 'background-color 0.15s',
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {load.originCity}, {load.originState} &rarr; {load.destCity}, {load.destState}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
            {load.payout !== null && (
              <Typography variant="caption" color="text.secondary">
                ${load.payout.toLocaleString()}
              </Typography>
            )}
            {load.ratePerMile !== null && (
              <Typography variant="caption" color="text.secondary">
                ${load.ratePerMile.toFixed(2)}/mi
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled">
              {Math.round(distance)} mi away
            </Typography>
            <Chip
              label={load.source.toUpperCase()}
              size="small"
              color={load.source === 'relay' ? 'primary' : 'warning'}
              sx={{ height: 18, fontSize: '0.625rem' }}
            />
          </Stack>
        </Box>
      ))}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Load detail view
// ---------------------------------------------------------------------------

const LoadDetailPanel: React.FC<{
  load: StagedLoad;
  drivers: Driver[];
  onSelectDriver: (id: string) => void;
  onBack: () => void;
}> = ({ load, drivers, onSelectDriver, onBack }) => {
  const navigate = useNavigate();

  const nearbyDrivers = useMemo(() => {
    if (typeof load.originLat !== 'number' || typeof load.originLng !== 'number') {
      return [];
    }
    return drivers
      .filter(
        (d) =>
          typeof d.currentLatitude === 'number' && typeof d.currentLongitude === 'number',
      )
      .map((driver) => ({
        driver,
        distance: haversineDistance(
          load.originLat as number,
          load.originLng as number,
          driver.currentLatitude as number,
          driver.currentLongitude as number,
        ),
      }))
      .filter((item) => item.distance <= NEARBY_RADIUS_MI)
      .sort((a, b) => a.distance - b.distance);
  }, [load, drivers]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1 }}>
        <IconButton size="small" onClick={onBack} aria-label="Back">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
          Load Details
        </Typography>
        <Chip
          label={load.source.toUpperCase()}
          size="small"
          color={load.source === 'relay' ? 'primary' : 'warning'}
        />
      </Stack>
      <Divider />

      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body2" fontWeight={600}>
          {load.originCity}, {load.originState} &rarr; {load.destCity}, {load.destState}
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {load.payout !== null && (
            <Typography variant="body2">
              Payout: ${load.payout.toLocaleString()}
            </Typography>
          )}
          {load.ratePerMile !== null && (
            <Typography variant="body2">
              Rate/mile: ${load.ratePerMile.toFixed(2)}
            </Typography>
          )}
          {load.equipmentType && (
            <Typography variant="body2">Equipment: {load.equipmentType}</Typography>
          )}
          {load.totalMiles !== null && (
            <Typography variant="body2">Miles: {load.totalMiles}</Typography>
          )}
          {load.firstPickupTime && (
            <Typography variant="body2">
              Pickup: {new Date(load.firstPickupTime).toLocaleString()}
            </Typography>
          )}
        </Stack>
      </Box>

      <Divider />
      <Typography variant="overline" color="text.secondary" sx={{ px: 2, pt: 1.5 }}>
        Nearby Drivers ({nearbyDrivers.length})
      </Typography>

      {nearbyDrivers.length === 0 && (
        <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.disabled">
            No drivers within {NEARBY_RADIUS_MI} miles
          </Typography>
        </Box>
      )}

      {nearbyDrivers.map(({ driver, distance }) => (
        <Box
          key={driver.id}
          onClick={() => onSelectDriver(driver.id)}
          sx={{
            px: 2,
            py: 1.25,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
            transition: 'background-color 0.15s',
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {driver.firstName} {driver.lastName}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
            {(driver.currentCity || driver.currentState) && (
              <Typography variant="caption" color="text.secondary">
                {[driver.currentCity, driver.currentState].filter(Boolean).join(', ')}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled">
              {Math.round(distance)} mi away
            </Typography>
            <Chip
              label={driver.isAvailable ? 'Available' : 'Busy'}
              size="small"
              color={driver.isAvailable ? 'success' : 'default'}
              sx={{ height: 18, fontSize: '0.625rem' }}
            />
          </Stack>
        </Box>
      ))}

      <Box sx={{ px: 2, py: 1.5 }}>
        <Button
          variant="outlined"
          size="small"
          fullWidth
          startIcon={<OpenInNewIcon />}
          onClick={() => navigate('/loads/new')}
        >
          Book This Load
        </Button>
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export const CommandCenterPanel: React.FC<CommandCenterPanelProps> = ({
  mode,
  drivers = [],
  feedLoads = [],
  selectedDriverId,
  selectedLoadId,
  onSelectDriver,
  onSelectLoad,
  onBack,
}) => {
  const dispatch = useDispatch();
  const layers = useSelector(selectCommandCenterLayers);

  const selectedDriver = selectedDriverId
    ? drivers.find((d) => d.id === selectedDriverId) ?? null
    : null;

  const selectedLoad = selectedLoadId
    ? feedLoads.find((l) => l.id === selectedLoadId) ?? null
    : null;

  return (
    <Box
      sx={{
        width: 360,
        minWidth: 360,
        borderLeft: 1,
        borderColor: 'divider',
        overflowY: 'auto',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mr: 0.5, alignSelf: 'center' }}>
          Layers
        </Typography>
        <Chip
          label="Drivers"
          variant={layers.showDrivers ? 'filled' : 'outlined'}
          color="success"
          size="small"
          sx={{ height: 24, fontSize: '0.6875rem' }}
          onClick={() => dispatch(toggleCommandCenterLayer('showDrivers'))}
        />
        <Chip
          label="Feed"
          variant={layers.showFeedLoads ? 'filled' : 'outlined'}
          color="primary"
          size="small"
          sx={{ height: 24, fontSize: '0.6875rem' }}
          onClick={() => dispatch(toggleCommandCenterLayer('showFeedLoads'))}
        />
        <Chip
          label="Active"
          variant={layers.showActiveLoads ? 'filled' : 'outlined'}
          size="small"
          sx={{
            height: 24,
            fontSize: '0.6875rem',
            ...(layers.showActiveLoads && {
              bgcolor: 'indigo.500',
              color: 'white',
              '&:hover': { bgcolor: 'indigo.600' },
            }),
          }}
          onClick={() => dispatch(toggleCommandCenterLayer('showActiveLoads'))}
        />
      </Stack>

      {mode === 'roster' && (
        <DriverRoster drivers={drivers} onSelectDriver={onSelectDriver} />
      )}
      {mode === 'driver-detail' && selectedDriver && (
        <DriverDetailPanel
          driver={selectedDriver}
          feedLoads={feedLoads}
          onSelectLoad={onSelectLoad}
          onBack={onBack}
        />
      )}
      {mode === 'load-detail' && selectedLoad && (
        <LoadDetailPanel
          load={selectedLoad}
          drivers={drivers}
          onSelectDriver={onSelectDriver}
          onBack={onBack}
        />
      )}
    </Box>
  );
};
