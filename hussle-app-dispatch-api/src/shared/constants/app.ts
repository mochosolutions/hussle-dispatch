// Single source of truth for the brand/app name across the API.
// Overridable via APP_NAME env var to support brand-rename rollouts without code changes.
//
// UI side mirrors this via `hussle-app-dispatch-ui/src/config.ts` (`config.appName`).

export const APP_NAME: string = process.env['APP_NAME'] ?? 'FleetCommand';
