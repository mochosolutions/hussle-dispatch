import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormikProps } from 'formik';
import { calculateRouteDistance } from 'utils/api/places/placeApi';
import type { LoadFormValues } from '../../../../../../validators/loadSchema';

const DEBOUNCE_MS = 400;

interface Waypoint {
  lat: number;
  lng: number;
}

interface RouteDistanceState {
  legMiles: (number | null)[];
  totalMiles: number;
  isLoading: boolean;
  legIsEstimated: boolean[];
  isEstimated: boolean;
}

/**
 * Builds a stable fingerprint string from stop coordinates.
 * Returns null if fewer than 2 stops have coordinates.
 */
const buildCoordinateFingerprint = (
  stops: LoadFormValues['stops'],
): string | null => {
  const coords = stops.map((stop) => {
    const { lat, lng } = stop;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `${lat},${lng}`;
    }
    return '';
  });

  const validCount = coords.filter(Boolean).length;
  if (validCount < 2) {
    return null;
  }

  return coords.join('|');
};

/**
 * Extracts waypoints from stops that have lat/lng coordinates.
 * Returns null if not all stops have coordinates (partial route).
 */
const extractWaypoints = (stops: LoadFormValues['stops']): Waypoint[] | null => {
  const waypoints: Waypoint[] = [];

  stops.forEach((stop) => {
    const { lat, lng } = stop;
    if (typeof lat === 'number' && typeof lng === 'number') {
      waypoints.push({ lat, lng });
    }
  });

  if (waypoints.length < 2 || waypoints.length !== stops.length) {
    return null;
  }

  return waypoints;
};

/**
 * Watches stop coordinates and fetches route distance from the API.
 * Backend handles haversine fallback when AWS is unavailable.
 * Stores calculatedTripMiles and isEstimated in formik for RateSidebar consumption.
 */
export const useRouteDistance = (
  formik: FormikProps<LoadFormValues>,
): RouteDistanceState => {
  const stops = formik.values.stops;
  const [legMiles, setLegMiles] = useState<(number | null)[]>([]);
  const [legIsEstimated, setLegIsEstimated] = useState<boolean[]>([]);
  const [apiTotalMiles, setApiTotalMiles] = useState<number | null>(null);
  const [isEstimated, setIsEstimated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFingerprintRef = useRef<string | null>(null);
  const setFieldValueRef = useRef(formik.setFieldValue);
  useEffect(() => {
    setFieldValueRef.current = formik.setFieldValue;
  }, [formik.setFieldValue]);

  const fingerprint = useMemo(() => buildCoordinateFingerprint(stops), [stops]);

  const resetState = useCallback(() => {
    setLegMiles([]);
    setLegIsEstimated([]);
    setApiTotalMiles(null);
    setIsEstimated(false);
    void setFieldValueRef.current('calculatedTripMiles', null);
    void setFieldValueRef.current('isMilesEstimated', false);
  }, []);

  const fetchRouteDistance = useCallback(
    (waypoints: Waypoint[], fp: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);

      void calculateRouteDistance(waypoints)
        .then((result) => {
          if (controller.signal.aborted) {
            return;
          }

          lastFingerprintRef.current = fp;
          const legs = result.legs.map((leg) => Math.round(leg.distanceMiles));
          const legEstimated = result.legs.map((leg) => leg.isEstimated);
          setLegMiles(legs);
          setLegIsEstimated(legEstimated);
          setApiTotalMiles(Math.round(result.totalMiles));
          setIsEstimated(result.isEstimated);
          void setFieldValueRef.current('calculatedTripMiles', Math.round(result.totalMiles));
          void setFieldValueRef.current('isMilesEstimated', result.isEstimated);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return;
          }

          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }

          setLegMiles([]);
          setLegIsEstimated([]);
          setApiTotalMiles(null);
          setIsEstimated(false);
          void setFieldValueRef.current('calculatedTripMiles', null);
          void setFieldValueRef.current('isMilesEstimated', false);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    },
    [],
  );

  useEffect(() => {
    if (fingerprint === null || fingerprint === lastFingerprintRef.current) {
      if (fingerprint === null) {
        const resetTimer = setTimeout(resetState, 0);
        return () => {
          clearTimeout(resetTimer);
        };
      }
      return;
    }

    const waypoints = extractWaypoints(stops);
    if (waypoints === null) {
      const resetTimer = setTimeout(resetState, 0);
      return () => {
        clearTimeout(resetTimer);
      };
    }

    const timer = setTimeout(() => {
      fetchRouteDistance(waypoints, fingerprint);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [fingerprint, fetchRouteDistance, stops, resetState]);

  // Clean up abort controller on unmount
  useEffect(
    () => () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    },
    [],
  );

  // Compute per-stop leg miles (index 0 = null since no preceding stop)
  const computedLegMiles = stops.map((_stop, idx) => {
    if (idx === 0) {
      return null;
    }

    if (legMiles.length > 0 && idx - 1 < legMiles.length) {
      return legMiles[idx - 1] ?? null;
    }

    return null;
  });

  const computedLegIsEstimated = stops.map((_stop, idx) => {
    if (idx === 0) {
      return false;
    }

    if (legIsEstimated.length > 0 && idx - 1 < legIsEstimated.length) {
      return legIsEstimated[idx - 1] ?? false;
    }

    return false;
  });

  const totalMiles = apiTotalMiles ?? 0;

  return {
    legMiles: computedLegMiles,
    totalMiles,
    isLoading,
    legIsEstimated: computedLegIsEstimated,
    isEstimated,
  };
};
