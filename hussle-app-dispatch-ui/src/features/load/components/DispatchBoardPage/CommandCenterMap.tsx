import { useEffect, useMemo, useState } from 'react';
import { Box, useTheme } from '@mui/material';

import { BodyMuted, SectionTitle } from 'components/Typography';
import MapIcon from '@mui/icons-material/Map';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { Map, Marker, useMap } from 'react-map-gl/maplibre';
import { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import config from '../../../../config';
import type { Driver } from 'features/carrier/types';
import type { StagedLoad } from '../../types';
import type { LoadListItem } from '../../types';
import type { CommandCenterLayers } from '../../store/reducers/loadPageSlice';

interface CommandCenterMapProps {
  feedLoads: StagedLoad[];
  drivers: Driver[];
  activeLoads: LoadListItem[];
  layers: CommandCenterLayers;
  sourceFilter: 'all' | string;
  selectedDriverId: string | null;
  selectedLoadId: string | null;
  onDriverClick: (id: string) => void;
  onLoadClick: (id: string) => void;
  onActiveLoadClick: (id: string) => void;
}

interface ValidLoad extends StagedLoad {
  originLat: number;
  originLng: number;
}

interface ValidDriver extends Driver {
  currentLatitude: number;
  currentLongitude: number;
}

const isValidLoad = (load: StagedLoad): load is ValidLoad =>
  typeof load.originLat === 'number' && typeof load.originLng === 'number';

const isValidDriver = (driver: Driver): driver is ValidDriver =>
  typeof driver.currentLatitude === 'number' && typeof driver.currentLongitude === 'number';

interface ValidActiveLoad extends LoadListItem {
  route: LoadListItem['route'] & {
    destLat: number;
    destLng: number;
  };
}

const isValidActiveLoad = (load: LoadListItem): load is ValidActiveLoad =>
  typeof load.route.destLat === 'number' && typeof load.route.destLng === 'number';

const MapContent: React.FC<CommandCenterMapProps> = ({
  feedLoads,
  drivers,
  activeLoads,
  layers,
  sourceFilter,
  selectedDriverId,
  selectedLoadId,
  onDriverClick,
  onLoadClick,
  onActiveLoadClick,
}) => {
  const theme = useTheme();
  const { 'command-center-map': mapRef } = useMap();

  const visibleLoads = useMemo(
    () =>
      layers.showFeedLoads
        ? feedLoads
            .filter((l) => sourceFilter === 'all' || l.source === sourceFilter)
            .filter(isValidLoad)
        : [],
    [feedLoads, layers.showFeedLoads, sourceFilter],
  );

  const visibleActiveLoads = useMemo(
    () => (layers.showActiveLoads ? activeLoads.filter(isValidActiveLoad) : []),
    [activeLoads, layers.showActiveLoads],
  );

  const visibleDrivers = useMemo(
    () => (layers.showDrivers ? drivers.filter(isValidDriver) : []),
    [drivers, layers.showDrivers],
  );

  useEffect(() => {
    const map = mapRef?.getMap();
    const allPoints = [
      ...visibleLoads.map((l) => ({ lng: l.originLng, lat: l.originLat })),
      ...visibleDrivers.map((d) => ({ lng: d.currentLongitude, lat: d.currentLatitude })),
      ...visibleActiveLoads.map((l) => ({ lng: l.route.destLng, lat: l.route.destLat })),
    ];
    if (!map || allPoints.length === 0) {
      return;
    }

    if (allPoints.length === 1) {
      map.flyTo({ center: [allPoints[0].lng, allPoints[0].lat], zoom: 8 });
      return;
    }

    const bounds = new LngLatBounds();
    allPoints.forEach((p) => {
      bounds.extend([p.lng, p.lat]);
    });
    map.fitBounds(bounds, { padding: 60 });
  }, [mapRef, visibleLoads, visibleDrivers, visibleActiveLoads]);

  const getLoadColor = (source: string): string =>
    source === 'relay' ? theme.palette.primary.main : theme.palette.orange[500];

  const getDriverColor = (isAvailable: boolean): string =>
    isAvailable ? theme.palette.success.main : theme.palette.grey[400];

  return (
    <>
      {visibleLoads.map((load) => (
        <Marker
          key={load.id}
          longitude={load.originLng}
          latitude={load.originLat}
          anchor="center"
          onClick={() => onLoadClick(load.id)}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: getLoadColor(load.source),
              border: selectedLoadId === load.id ? '3px solid' : '2px solid white',
              borderColor: selectedLoadId === load.id ? 'warning.main' : 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              transition: 'border 0.15s ease',
            }}
          />
        </Marker>
      ))}
      {visibleDrivers.map((driver) => (
        <Marker
          key={`driver-${driver.id}`}
          longitude={driver.currentLongitude}
          latitude={driver.currentLatitude}
          anchor="center"
          onClick={() => onDriverClick(driver.id)}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              bgcolor: getDriverColor(driver.isAvailable),
              border: selectedDriverId === driver.id ? '3px solid' : '2px solid white',
              borderColor: selectedDriverId === driver.id ? 'warning.main' : 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border 0.15s ease',
            }}
          >
            <LocalShippingIcon sx={{ fontSize: 16, color: 'white' }} />
          </Box>
        </Marker>
      ))}
      {visibleActiveLoads.map((load) => (
        <Marker
          key={`active-${load.id}`}
          longitude={load.route.destLng}
          latitude={load.route.destLat}
          anchor="center"
          onClick={() => onActiveLoadClick(load.id)}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              bgcolor: theme.palette.indigo[500],
              border: '2px solid white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              cursor: 'pointer',
            }}
          />
        </Marker>
      ))}
    </>
  );
};

export const CommandCenterMap: React.FC<CommandCenterMapProps> = (props) => {
  const [mapError, setMapError] = useState(false);

  if (!config.map.styleUrl || mapError) {
    return (
      <Box
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <MapIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <SectionTitle sx={{ color: 'text.secondary' }}>
            Map unavailable
          </SectionTitle>
          <BodyMuted sx={{ mt: 0.5, color: 'text.disabled' }}>
            Map service is not configured.
          </BodyMuted>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Map
        id="command-center-map"
        initialViewState={{ longitude: -98, latitude: 39, zoom: 3.5 }}
        mapStyle={config.map.styleUrl}
        onError={(e) => {
          const msg = String(e?.error?.message ?? '');
          if (msg.includes('style') || msg.includes('Style')) {
            setMapError(true);
          }
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <MapContent {...props} />
      </Map>
    </Box>
  );
};
