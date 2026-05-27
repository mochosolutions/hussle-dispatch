# Auth fast mode — E2E testing overrides

Set these env vars on the API process to compress the token lifecycle for local exploration or Playwright tests. Defaults are production values; setting these overrides them at process boot.

| Var | Production default | Fast-mode example |
|---|---|---|
| JWT_EXPIRES_IN | 1h | 10s |
| REFRESH_TTL_BASE_SECONDS | 604800 (7d) | 60 |
| REFRESH_TTL_EXTENDED_SECONDS | 2592000 (30d) | 180 |
| ROTATION_GRACE_TTL_SECONDS | 10 | 5 |

With fast-mode, the full token lifecycle (proactive refresh → rotation w/ grace → eventual session expiry) runs in under 3 minutes wall-clock. Restart the API process after changing these.
