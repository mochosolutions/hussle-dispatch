import { useState, useEffect, useMemo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import { Map, Marker, Source, Layer, useMap } from 'react-map-gl/maplibre';
import { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import config from '../../../../../config';

interface StopMarker {
  type: string;
  sequence: number;
  lat?: number | null;
  lng?: number | null;
  city?: string;
  state?: string;
  facilityName?: string;
}

interface ValidStop {
  type: string;
  sequence: number;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  facilityName?: string;
}

export interface MapViewProps {
  stops?: StopMarker[];
  height?: number | string;
}

const isValidStop = (stop: StopMarker): stop is ValidStop =>
  typeof stop.lat === 'number' && typeof stop.lng === 'number';

const STYLE_URL = config.map.styleUrl;

const getMarkerStyle = (type: string): { bgcolor: string; label: string } => {
  if (type === 'PICKUP') {
    return { bgcolor: 'primary.main', label: 'P' };
  }
  if (type === 'DRIVER') {
    return { bgcolor: 'error.main', label: '\uD83D\uDE9B' };
  }
  return { bgcolor: 'success.main', label: 'D' };
};

const MapContent: React.FC<{ stops: StopMarker[] }> = ({ stops }) => {
  const { 'load-map': mapRef } = useMap();

  const validStops = useMemo(() => stops.filter(isValidStop), [stops]);

  const geojsonData = useMemo(() => {
    if (validStops.length < 2) {
      return null;
    }
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: validStops.map((s) => [s.lng, s.lat]),
      },
    };
  }, [validStops]);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || validStops.length === 0) {
      return;
    }

    if (validStops.length === 1) {
      const stop = validStops[0];
      map.flyTo({ center: [stop.lng, stop.lat], zoom: 8 });
      return;
    }

    const bounds = new LngLatBounds();
    validStops.forEach((stop) => {
      bounds.extend([stop.lng, stop.lat]);
    });
    map.fitBounds(bounds, { padding: 60 });
  }, [mapRef, validStops]);

  return (
    <>
      {validStops.map((stop) => {
        const { bgcolor, label } = getMarkerStyle(stop.type);
        return (
          <Marker
            key={stop.sequence}
            longitude={stop.lng}
            latitude={stop.lat}
            anchor="center"
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor,
                color: 'white',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {label}
            </Box>
          </Marker>
        );
      })}
      {geojsonData && (
        <Source id="route-line" type="geojson" data={geojsonData}>
          <Layer
            id="route-line-layer"
            type="line"
            paint={{ 'line-color': '#1976d2', 'line-width': 2 }}
          />
        </Source>
      )}
    </>
  );
};

export const MapView: React.FC<MapViewProps> = ({ stops = [], height = 280 }) => {
  const [maplibreLoaded, setMaplibreLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    import('maplibre-gl').then(() => {
      setMaplibreLoaded(true);
    });
  }, []);

  const mapUnavailableFallback = (
    <Box
      sx={{
        height,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <MapIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
          Map unavailable
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
          Map service is not configured. Stops can still be added below.
        </Typography>
      </Box>
    </Box>
  );

  if (!config.map.styleUrl || mapError) {
    return mapUnavailableFallback;
  }

  if (!maplibreLoaded) {
    return (
      <Box
        sx={{
          height,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 1,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
      <Map
        id="load-map"
        initialViewState={{ longitude: -98, latitude: 39, zoom: 3.5 }}
        mapStyle={STYLE_URL}
        onError={(e) => {
          const msg = String(e?.error?.message ?? '');
          if (msg.includes('style') || msg.includes('Style')) {
            setMapError(true);
          }
        }}
      >
        <MapContent stops={stops} />
      </Map>
    </Box>
  );
};
