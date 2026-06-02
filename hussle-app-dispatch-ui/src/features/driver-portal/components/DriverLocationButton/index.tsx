import { useState, useEffect, useRef } from 'react';
import { Button, Alert, Box } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { checkIn } from 'utils/api/driver-portal/driverPortalApi';
import { PORTAL_GEOLOCATION_TIMEOUT_MS, PORTAL_SUCCESS_DISMISS_MS } from '../../constants';

interface DriverLocationButtonProps {
  loadId: string;
}

export const DriverLocationButton: React.FC<DriverLocationButtonProps> = ({ loadId }) => {
  const [sharing, setSharing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
      if (abortRef.current !== null) {
        abortRef.current.abort();
      }
    },
    [],
  );

  const dismissSuccess = () => {
    if (successTimerRef.current !== null) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    setSuccess(false);
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setError('Location services are not available on this device.');
      return;
    }

    if (abortRef.current !== null) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setSharing(true);
    setError(null);
    dismissSuccess();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (controller.signal.aborted) {
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
          setSharing(false);
          return;
        }
        try {
          await checkIn(
            loadId,
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            controller.signal,
          );
          if (controller.signal.aborted) {
            return;
          }
          setSuccess(true);
          successTimerRef.current = setTimeout(() => {
            setSuccess(false);
            successTimerRef.current = null;
          }, PORTAL_SUCCESS_DISMISS_MS);
        } catch {
          if (controller.signal.aborted) {
            return;
          }
          setError('Failed to share location. Please try again.');
        } finally {
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
          setSharing(false);
        }
      },
      () => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        if (controller.signal.aborted) {
          setSharing(false);
          return;
        }
        setError('Location permission denied. Please enable location access.');
        setSharing(false);
      },
      { timeout: PORTAL_GEOLOCATION_TIMEOUT_MS, enableHighAccuracy: true },
    );
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<MyLocationIcon />}
        onClick={handleShareLocation}
        disabled={sharing}
        sx={{ py: 1.5 }}
      >
        {sharing ? 'Sharing Location...' : 'Share My Location'}
      </Button>
      {success && (
        <Alert severity="success" sx={{ mt: 1 }} onClose={dismissSuccess}>
          Location shared
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
};
