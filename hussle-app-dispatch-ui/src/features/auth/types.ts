// Frontend-only enum (NOT over the wire). Drives the `sessionExpired({ context })`
// Redux action dispatched by the axios interceptor on definitive auth failure.
// Mirrors .planning/auth-login-fix/types.ts.
export enum SessionExpiredContext {
  MAIN = 'main',
  PORTAL = 'portal',
}
