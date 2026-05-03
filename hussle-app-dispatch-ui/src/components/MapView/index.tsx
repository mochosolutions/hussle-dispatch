import { useState, useEffect, useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';

import { BodyMuted, SectionTitle } from 'components/Typography';
import MapIcon from '@mui/icons-material/Map';
import { Map, Marker, Source, Layer, useMap } from 'react-map-gl/maplibre';
import { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import config from '../../config';

interface StopMarker {
  type: string;
  sequence: number;
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  state?: string | null;
  facilityName?: string | null;
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

export interface DriverMarker {
  lat: number;
  lng: number;
}

export interface MapViewProps {
  stops?: StopMarker[];
  driver?: DriverMarker | null;
  height?: number | string;
}

const isValidStop = (stop: StopMarker): stop is ValidStop =>
  typeof stop.lat === 'number' && typeof stop.lng === 'number';

const STYLE_URL = config.map.styleUrl;

const getMarkerStyle = (type: string): { bgcolor: string; label: string } => {
  if (type === 'PICKUP') {
    return { bgcolor: 'primary.main', label: 'P' };
  }
  return { bgcolor: 'success.main', label: 'D' };
};

const isValidDriver = (driver: DriverMarker | null | undefined): driver is DriverMarker =>
  driver !== null &&
  driver !== undefined &&
  typeof driver.lat === 'number' &&
  typeof driver.lng === 'number';

const MapContent: React.FC<{
  stops: StopMarker[];
  driver: DriverMarker | null | undefined;
  mapLoaded: boolean;
}> = ({ stops, driver, mapLoaded }) => {
  const maps = useMap();
  const mapRef = maps['load-map'] ?? maps.current;

  const validStops = useMemo(() => stops.filter(isValidStop), [stops]);
  const validDriver = isValidDriver(driver) ? driver : null;

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
    if (!map || !mapLoaded) {
      return;
    }

    const points: [number, number][] = validStops.map((s) => [s.lng, s.lat]);
    if (validDriver) {
      points.push([validDriver.lng, validDriver.lat]);
    }

    if (points.length === 0) {
      return;
    }

    if (points.length === 1) {
      map.flyTo({ center: points[0], zoom: 8 });
      return;
    }

    const bounds = new LngLatBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, { padding: 60, maxZoom: 11 });
  }, [mapRef, mapLoaded, validStops, validDriver]);

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
      {validDriver && (
        <Marker longitude={validDriver.lng} latitude={validDriver.lat} anchor="center">
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              bgcolor: 'error.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            🚛
          </Box>
        </Marker>
      )}
    </>
  );
};

export const MapView: React.FC<MapViewProps> = ({ stops = [], driver = null, height = 280 }) => {
  const [maplibreLoaded, setMaplibreLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

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
        <SectionTitle sx={{ color: 'text.secondary' }}>Map unavailable</SectionTitle>
        <BodyMuted sx={{ mt: 0.5, color: 'text.disabled' }}>
          Map service is not configured.
        </BodyMuted>
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
        onLoad={() => setMapLoaded(true)}
        onError={(e) => {
          const msg = String(e?.error?.message ?? '');
          if (msg.includes('style') || msg.includes('Style')) {
            setMapError(true);
          }
        }}
      >
        <MapContent stops={stops} driver={driver} mapLoaded={mapLoaded} />
      </Map>
    </Box>
  );
};
