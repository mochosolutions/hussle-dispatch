import React, { useEffect, useRef, useState } from 'react';
import { Box, Link, OutlinedInput, Typography } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { enqueueSnackbar } from 'notistack';

import { buildWorkspaceRoute } from '../../buildWorkspaceRoute';
import { estimateMarketScore } from '../../estimateMarketScore';
import { estimateRouteMiles } from '../../estimateRouteMiles';
import { getScoreTier } from '../../getScoreTier';
import { FLEET_DRIVERS, FLEET_VEHICLES, MOCK_DRIVER_VEHICLE_MAP, MOCK_LOADS } from '../../mockData';
import type { Stop, WorkspaceRoute } from '../../types';
import { DetailDrawer } from '../DetailDrawer';
import { DriverVehicleAssignment } from '../DriverVehicleAssignment';
import { LoadWorkspaceFooter } from '../LoadWorkspaceFooter';
import { LoadWorkspaceHeader } from '../LoadWorkspaceHeader';
import { RouteStopsEditor } from '../RouteStopsEditor';

interface LoadWorkspaceDrawerProps {
  loadId: string;
  onClose: () => void;
}

const getInitialRate = (loadId: string): string => {
  const load = MOCK_LOADS.find((l) => l.id === loadId);
  if (load?.rate !== null && load?.rate !== undefined) {
    return String(load.rate);
  }
  return '';
};

const MarketDot: React.FC<{ color: string }> = ({ color }) => (
  <Box
    component="span"
    sx={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      bgcolor: color,
      display: 'inline-block',
      mr: 0.5,
    }}
  />
);

const MarketCard: React.FC<{ label: string; city: string; score: number }> = ({
  label,
  city,
  score,
}) => {
  const tier = getScoreTier(score);

  return (
    <Box
      sx={{
        flex: 1,
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
        <MarketDot color={tier.color} />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {city}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {score}
        </Typography>
      </Box>
    </Box>
  );
};

export const LoadWorkspaceDrawer: React.FC<LoadWorkspaceDrawerProps> = ({ loadId, onClose }) => {
  const load = MOCK_LOADS.find((l) => l.id === loadId);

  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [negotiatedRate, setNegotiatedRate] = useState(() => getInitialRate(loadId));
  const [notes, setNotes] = useState('');
  const [prevLoadId, setPrevLoadId] = useState(loadId);
  const [workspaceRoute, setWorkspaceRoute] = useState<WorkspaceRoute>(
    () => (load ? buildWorkspaceRoute(load) : { stops: [], totalMiles: 0, totalWeight: 0, originMarket: { city: '', score: 0 }, destinationMarket: { city: '', score: 0 } }),
  );
  const rateInputRef = useRef<HTMLInputElement>(null);

  // Reset local state when switching loads (setState-during-render pattern)
  if (prevLoadId !== loadId) {
    setPrevLoadId(loadId);
    setSelectedDriverId(null);
    setNegotiatedRate(getInitialRate(loadId));
    setNotes('');
    if (load) {
      setWorkspaceRoute(buildWorkspaceRoute(load));
    }
  }

  // Auto-focus negotiated rate when rate is null ("Call")
  useEffect(() => {
    if (load?.rate === null) {
      const timer = setTimeout(() => {
        rateInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [load?.rate]);

  if (!load) {
    return null;
  }

  const handleRouteChange = (updatedStops: Stop[]) => {
    const totalMiles = estimateRouteMiles(updatedStops);
    const totalWeight = updatedStops.reduce((sum, s) => sum + (s.weight ?? 0), 0);
    const pickups = updatedStops.filter((s) => s.type === 'pickup');
    const dropoffs = updatedStops.filter((s) => s.type === 'dropoff');
    const firstPickup = pickups[0];
    const lastDropoff = dropoffs[dropoffs.length - 1];

    setWorkspaceRoute({
      stops: updatedStops,
      totalMiles,
      totalWeight,
      originMarket: firstPickup
        ? estimateMarketScore(firstPickup.location.city)
        : workspaceRoute.originMarket,
      destinationMarket: lastDropoff
        ? estimateMarketScore(lastDropoff.location.city)
        : workspaceRoute.destinationMarket,
    });
  };

  const routeChanged = workspaceRoute.totalMiles !== load.miles;

  const isDirty =
    selectedDriverId !== null ||
    negotiatedRate !== (load.rate !== null ? String(load.rate) : '') ||
    notes !== '' ||
    routeChanged;

  const relativeTime = formatDistanceToNow(new Date(load.source.dateAdded), { addSuffix: true });

  const selectedDriver = selectedDriverId
    ? FLEET_DRIVERS.find((d) => d.id === selectedDriverId) ?? null
    : null;

  const handleDismiss = () => {
    enqueueSnackbar('Load dismissed', { variant: 'info' });
    onClose();
  };

  const handleSave = () => {
    enqueueSnackbar('Changes saved', { variant: 'success' });
  };

  const handleAssign = () => {
    if (selectedDriver) {
      const vehicleId = MOCK_DRIVER_VEHICLE_MAP[selectedDriver.id];
      const vehicle = vehicleId
        ? FLEET_VEHICLES.find((v) => v.id === vehicleId)
        : undefined;
      const vehicleSuffix = vehicle ? ` on ${vehicle.unitNumber}` : '';
      enqueueSnackbar(`Load assigned to ${selectedDriver.name}${vehicleSuffix}`, {
        variant: 'success',
      });
      onClose();
    }
  };

  const firstPickup = workspaceRoute.stops.find((s) => s.type === 'pickup');
  const lastDropoff = [...workspaceRoute.stops].reverse().find((s) => s.type === 'dropoff');
  const stopCount = workspaceRoute.stops.length;
  const routeHeadline = `${firstPickup?.location.city || '\u2014'}, ${firstPickup?.location.state || '\u2014'} \u2192 ${lastDropoff?.location.city || '\u2014'}, ${lastDropoff?.location.state || '\u2014'}${stopCount > 2 ? ` (${stopCount} stops)` : ''}`;

  return (
    <DetailDrawer
      open
      onClose={onClose}
      title={routeHeadline}
      subtitle={`${load.id}${load.externalId ? ` \u00B7 ${load.externalId}` : ''}`}
      footer={
        <LoadWorkspaceFooter
          selectedDriverId={selectedDriverId}
          isDirty={isDirty}
          onDismiss={handleDismiss}
          onSave={handleSave}
          onAssign={handleAssign}
        />
      }
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Header info */}
        <LoadWorkspaceHeader
          load={load}
          milesOverride={workspaceRoute.totalMiles}
          totalWeight={workspaceRoute.totalWeight}
          routeHeadline={routeHeadline}
        />

        {/* Route Stops Editor */}
        <RouteStopsEditor stops={workspaceRoute.stops} onChange={handleRouteChange} />

        {/* A. Driver Assignment */}
        <DriverVehicleAssignment
          selectedDriverId={selectedDriverId}
          onSelectDriver={setSelectedDriverId}
        />

        {/* B. Editable Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Negotiated Rate
            </Typography>
            <OutlinedInput
              inputRef={rateInputRef}
              value={negotiatedRate}
              onChange={(e) => setNegotiatedRate(e.target.value)}
              type="number"
              startAdornment={
                <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                  $
                </Typography>
              }
              size="small"
              fullWidth
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Notes
            </Typography>
            <OutlinedInput
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              placeholder="Add notes..."
              size="small"
              fullWidth
            />
          </Box>
        </Box>

        {/* C. Market Info */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <MarketCard
            label="Origin Market"
            city={workspaceRoute.originMarket.city}
            score={workspaceRoute.originMarket.score}
          />
          <MarketCard
            label="Dest Market"
            city={workspaceRoute.destinationMarket.city}
            score={workspaceRoute.destinationMarket.score}
          />
        </Box>

        {/* D. Customer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {load.customer.name}
          </Typography>
          <Link href={`tel:${load.customer.phone}`} variant="body2" underline="hover">
            {load.customer.phone}
          </Link>
        </Box>

        {/* E. Source */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {load.source.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {relativeTime}
          </Typography>
        </Box>
      </Box>
    </DetailDrawer>
  );
};
