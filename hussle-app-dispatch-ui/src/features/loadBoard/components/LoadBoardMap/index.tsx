import { useState, useEffect, useMemo } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import { Map, Marker, Popup, useMap } from 'react-map-gl/maplibre';
import { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import config from '../../../../config';
import type { LoadBoardSource, StagedLoad } from '../../types/loadBoardTypes';

interface LoadBoardMapProps {
  loads: StagedLoad[];
  sourceFilter: 'all' | LoadBoardSource;
}

interface ValidLoad extends StagedLoad {
  originLat: number;
  originLng: number;
}

const isValidLoad = (load: StagedLoad): load is ValidLoad =>
  typeof load.originLat === 'number' && typeof load.originLng === 'number';

const getMarkerColor = (source: LoadBoardSource): string =>
  source === 'relay' ? '#2196F3' : '#FF9800';

const MapContent: React.FC<{
  loads: StagedLoad[];
  sourceFilter: 'all' | LoadBoardSource;
}> = ({ loads, sourceFilter }) => {
  const { 'load-board-map': mapRef } = useMap();
  const [selectedLoad, setSelectedLoad] = useState<StagedLoad | null>(null);

  const visibleLoads = useMemo(
    () =>
      loads
        .filter((l) => sourceFilter === 'all' || l.source === sourceFilter)
        .filter(isValidLoad),
    [loads, sourceFilter],
  );

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || visibleLoads.length === 0) {
      return;
    }

    if (visibleLoads.length === 1) {
      const load = visibleLoads[0];
      map.flyTo({ center: [load.originLng, load.originLat], zoom: 8 });
      return;
    }

    const bounds = new LngLatBounds();
    visibleLoads.forEach((load) => {
      bounds.extend([load.originLng, load.originLat]);
    });
    map.fitBounds(bounds, { padding: 60 });
  }, [mapRef, visibleLoads]);

  return (
    <>
      {visibleLoads.map((load) => (
        <Marker
          key={load.id}
          longitude={load.originLng}
          latitude={load.originLat}
          anchor="center"
          onClick={() => setSelectedLoad(load)}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: getMarkerColor(load.source),
              border: '2px solid white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              cursor: 'pointer',
            }}
          />
        </Marker>
      ))}
      {selectedLoad !== null &&
        typeof selectedLoad.originLng === 'number' &&
        typeof selectedLoad.originLat === 'number' && (
          <Popup
            longitude={selectedLoad.originLng}
            latitude={selectedLoad.originLat}
            onClose={() => setSelectedLoad(null)}
            closeOnClick={false}
            anchor="bottom"
          >
            <Box sx={{ p: 1, minWidth: 200 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {selectedLoad.originCity}, {selectedLoad.originState} &rarr;{' '}
                {selectedLoad.destCity}, {selectedLoad.destState}
              </Typography>
              {selectedLoad.payout !== null && (
                <Typography variant="body2">
                  Payout: ${selectedLoad.payout.toLocaleString()}
                </Typography>
              )}
              {selectedLoad.ratePerMile !== null && (
                <Typography variant="body2">
                  Rate/mile: ${selectedLoad.ratePerMile.toFixed(2)}
                </Typography>
              )}
              {selectedLoad.equipmentType && (
                <Typography variant="body2">
                  Equipment: {selectedLoad.equipmentType}
                </Typography>
              )}
              {selectedLoad.totalDuration !== null && (
                <Typography variant="body2">
                  Duration: {Math.floor(selectedLoad.totalDuration / 60)}h{' '}
                  {selectedLoad.totalDuration % 60}m
                </Typography>
              )}
              {selectedLoad.firstPickupTime && (
                <Typography variant="body2">
                  Pickup: {new Date(selectedLoad.firstPickupTime).toLocaleString()}
                </Typography>
              )}
              {selectedLoad.stopCount !== null && (
                <Typography variant="body2">Stops: {selectedLoad.stopCount}</Typography>
              )}
              <Chip
                size="small"
                label={selectedLoad.source.toUpperCase()}
                sx={{ mt: 0.5 }}
                color={selectedLoad.source === 'relay' ? 'primary' : 'warning'}
              />
            </Box>
          </Popup>
        )}
    </>
  );
};

export const LoadBoardMap: React.FC<LoadBoardMapProps> = ({ loads, sourceFilter }) => {
  const [mapError, setMapError] = useState(false);

  const mapUnavailableFallback = (
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
        <Typography variant="h6" color="text.secondary" fontWeight={600}>
          Map unavailable
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
          Map service is not configured.
        </Typography>
      </Box>
    </Box>
  );

  if (!config.map.styleUrl || mapError) {
    return mapUnavailableFallback;
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Map
        id="load-board-map"
        initialViewState={{ longitude: -98, latitude: 39, zoom: 3.5 }}
        mapStyle={config.map.styleUrl}
        onError={(e) => {
          // Only treat style-load failures as fatal — sprite/glyph 404s are non-fatal
          const msg = String(e?.error?.message ?? '');
          if (msg.includes('style') || msg.includes('Style')) {
            setMapError(true);
          }
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <MapContent loads={loads} sourceFilter={sourceFilter} />
      </Map>
    </Box>
  );
};
