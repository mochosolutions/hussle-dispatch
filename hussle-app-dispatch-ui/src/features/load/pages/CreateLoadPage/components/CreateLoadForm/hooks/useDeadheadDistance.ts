import { useEffect, useRef, useState } from 'react';
import { getDeadheadDistance } from 'utils/api/fleet/driverApi';

interface UseDeadheadDistanceInput {
  driverId: string | null;
  firstPickupCoords: { lat: number; lng: number } | null;
}

interface DeadheadDistanceState {
  deadheadMiles: number | null;
  isEstimated: boolean;
  source: 'coordinates' | 'geocoded' | null;
  isLoading: boolean;
}

const INITIAL_STATE: DeadheadDistanceState = {
  deadheadMiles: null,
  isEstimated: false,
  source: null,
  isLoading: false,
};

/**
 * Fetches deadhead distance from the driver's current location to the first pickup.
 * Resets when driverId or coordinates become null.
 */
export const useDeadheadDistance = (input: UseDeadheadDistanceInput): DeadheadDistanceState => {
  const { driverId, firstPickupCoords } = input;
  const [state, setState] = useState<DeadheadDistanceState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset when either input is missing
    if (!driverId || !firstPickupCoords) {
      setState(INITIAL_STATE);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setState((prev) => ({ ...prev, isLoading: true }));

    void getDeadheadDistance(driverId, firstPickupCoords.lat, firstPickupCoords.lng)
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          deadheadMiles: result.deadheadMiles,
          isEstimated: result.isEstimated,
          source: result.source,
          isLoading: false,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setState(INITIAL_STATE);
      });

    return () => {
      controller.abort();
    };
  }, [driverId, firstPickupCoords]);

  // Clean up on unmount
  useEffect(
    () => () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    },
    [],
  );

  return state;
};
