import { PORTAL_GEOLOCATION_TIMEOUT_MS } from './constants';

// Capture the device's current GPS position, resolving null on any failure
// (no permission, timeout, unsupported) so callers can proceed without coords.
export const captureLocation = (): Promise<{ latitude: number; longitude: number } | null> =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { timeout: PORTAL_GEOLOCATION_TIMEOUT_MS, enableHighAccuracy: false },
    );
  });
