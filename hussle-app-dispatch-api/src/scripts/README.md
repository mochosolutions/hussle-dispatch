# Operational Scripts

One-off TypeScript scripts that run against a live database / external services.
Invoke with `npx tsx` (or `npx ts-node -r tsconfig-paths/register`) from the
`hussle-app-dispatch-api/` package root. Every script imports `dotenv/config`,
so it picks up the same `.env` your local API uses.

## `backfillPlaces.ts`

Resolve every Stop that pre-dates auto-place resolution to a `Place` row using
the same pipeline that powers load create/update. The script streams stops in
batches of 100 (cursor pagination on `Stop.id`), calls `resolveStopToPlace` per
stop, and persists `placeId`, `resolutionStatus`, and the canonical
`facilityName` back onto the Stop row.

### Usage

```bash
# Live run across every organization
npx tsx src/scripts/backfillPlaces.ts

# Log per-stop outcomes without writing — safe to run anywhere
npx tsx src/scripts/backfillPlaces.ts --dry-run

# Scope to a single organization (also supports --dry-run)
npx tsx src/scripts/backfillPlaces.ts --org <organizationId>
```

### Required environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string (read-write). |
| `AWS_REGION` | AWS region for Location v2 (`createAwsLocationProvider`). |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Optional — if omitted, the AWS SDK falls back to its default credential chain (instance profile, SSO, etc.). |

### Idempotency

The candidate query filters `placeId IS NULL AND (address IS NOT NULL OR city
IS NOT NULL)`. Once a stop resolves to a place, its `placeId` is set and the
next run skips it automatically. Re-running the script after a successful pass
is a safe no-op — only stops that previously failed (e.g. `UNRESOLVED` due to
ambiguous address) remain candidates.

### Expected runtime

Each stop incurs one AWS Location round-trip (~100ms) plus a small Postgres
write. Order-of-magnitude:

- **~10 stops/second** sustained
- **~10,000 stops in ~17 minutes**

Multiply linearly for larger backlogs. The script is sequential by design —
running multiple instances in parallel risks duplicate Place creation despite
the `createOnConflictDoNothing` race-safe path.

### Outcome buckets

Every per-stop log line includes `outcome=<bucket>`, plus a final summary line
with all counts. Buckets correspond directly to `resolveStopToPlace`'s return
shape:

| Bucket | Meaning | Stop write |
|--------|---------|------------|
| `resolved` | Matched (tier-1 or tier-2 dedupe) or newly created Place. | `placeId` + `resolutionStatus=RESOLVED` (+ `facilityName` when canonicalized). |
| `ambiguous` | AWS match score < 0.7 (`STOP_AMBIGUOUS_ADDRESS`). | `resolutionStatus=AMBIGUOUS`, `placeId` left null. |
| `partial` | Stop missing street / city / state (`STOP_PARTIAL_ADDRESS`). | `resolutionStatus=UNRESOLVED`. |
| `notGeocoded` | AWS returned a non-accepted result type (`STOP_NOT_GEOCODED`). | `resolutionStatus=UNRESOLVED`. |
| `geocoderUnavailable` | Geocode call threw (`GEOCODER_UNAVAILABLE`). | `resolutionStatus=UNRESOLVED`. |
| `failed` | Unhandled exception (DB error, etc.). | No write. |

Note: the script does not distinguish "matched-to-existing" vs "auto-created"
Place rows — both fall under `resolved`. If that distinction is needed later,
we can compare `placeRepo.findById(...).createdAt` against the run start, but
that complexity isn't justified for a one-off backfill.

## `clearTenantData.ts`

Tenant-scoped or full-environment data wipe. Refuses to run against
`ENVIRONMENT_NAME=prod*`. Run with `--help`-style flags listed in the script's
`printUsage` output (e.g. `--tenant <slug>`, `--all`, `--dry-run`,
`--skip-cognito`).

## `previewEmails.ts`

Renders the React Email transactional templates and ships them to Mailpit
(`localhost:1025`) for visual inspection. Requires
`docker compose up mailpit`.
