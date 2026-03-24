import { useState } from 'react';
import { Button, Alert, Box } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { checkIn } from 'utils/api/driver-portal/driverPortalApi';

interface DriverLocationButtonProps {
  token: string;
}

export const DriverLocationButton: React.FC<DriverLocationButtonProps> = ({ token }) => {
  const [sharing, setSharing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      setError('Location services are not available on this device');
      return;
    }

    setSharing(true);
    setError(null);
    setSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await checkIn(token, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            status: 'Location shared',
          });
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } catch {
          setError('Failed to share location');
        } finally {
          setSharing(false);
        }
      },
      () => {
        setError('Location permission denied. Please enable location access.');
        setSharing(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
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
        <Alert severity="success" sx={{ mt: 1 }}>
          Location shared successfully
        </Alert>
      )}
      {error && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};
