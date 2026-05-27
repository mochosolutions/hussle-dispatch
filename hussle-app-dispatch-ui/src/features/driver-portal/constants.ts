// Geolocation timeout (ms). Mobile GPS can be slow on cold start, so the
// driver portal allows up to 10 s for both the status-transition auto-capture
// and the explicit Share My Location button. Single source of truth.
export const PORTAL_GEOLOCATION_TIMEOUT_MS = 10_000;

// Auto-dismiss timeout for success alerts (ms). Long enough to read on
// mobile while still being unobtrusive.
export const PORTAL_SUCCESS_DISMISS_MS = 4_000;
