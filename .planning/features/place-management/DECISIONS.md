# Decisions — place-management

## LOCKED (L) — Must follow exactly

- **L-001: Express + Prisma for all Place CRUD** — All routes use Express.js, all data access uses Prisma client (per foundation L-001)
- **L-002: UUID for entity IDs** — Place uses `@id @default(uuid())` (per foundation L-009)
- **L-003: Offset-based pagination** — Default 25, max 100, response envelope `{ data, meta: { page, limit, total, totalPages, hasMore } }`, sort via `?sort=field&order=asc|desc` (per foundation L-010)
- **L-004: Soft delete via deletedAt** — DELETE sets `deletedAt` timestamp; all queries filter `WHERE deletedAt IS NULL`; typeahead excludes soft-deleted places (per fleet-management L-004)
- **L-005: Geo auto-lookup is server-side** — On create/update, resolve city+state to lat/lng using foundation's getCityCoords from Redis centroids; set geoSource=AUTO. Manual override sets geoSource=MANUAL.
- **L-006: Typeahead endpoint separate from list** — `GET /api/v1/places/typeahead?q=&limit=10` is a distinct lightweight endpoint, not list with different params. Min 2 chars required.
- **L-007: PlaceTypeahead is a reusable component** — Built in dispatch-ui as a shared component; consumed later by load-management stop forms
- **L-008: MUI sx prop + Redux Toolkit + Saga + Formik + Yup** — Frontend follows existing dispatch-ui conventions (per fleet-management L-008)
- **L-009: FacilityType enum has 16 values** — WAREHOUSE, DISTRIBUTION_CENTER, CROSS_DOCK, COLD_STORAGE, PORT, RAIL_YARD, TRUCK_STOP, DROP_YARD, MANUFACTURING, RETAIL, FARM, CONSTRUCTION_SITE, MILITARY, GOVERNMENT, RESIDENTIAL, OTHER (per TDD schema)
- **L-010: DockType enum has 4 values** — DOCK_HIGH, GROUND_LEVEL, BOTH, NONE (per TDD schema)

## DEFERRED (D) — Agent decides at implementation

- **D-001: Form field ordering within sections** — Agent follows PRD section layout (Location, Facility Details, Contact & Intelligence) but decides exact field ordering
- **D-002: DataGrid column widths and sort defaults** — Agent decides; default sort by createdAt desc
- **D-003: Toast notification wording** — Agent decides using notistack for success/error messages
- **D-004: Typeahead debounce timing** — Agent decides (suggest 300ms)
- **D-005: PlaceTypeahead component placement** — Agent decides directory location within dispatch-ui (suggest src/components/PlaceTypeahead/ for reusability)
- **D-006: Contact dropdown implementation** — Agent decides how to present the associated contact searchable dropdown (suggest Autocomplete from MUI)

## EXCLUDED (X) — Out of scope

- **X-001: Stop creation** — Creating/editing stops on loads belongs to load-management; PlaceTypeahead is built here but consumed there
- **X-002: Contact CRUD** — Contact management belongs to fleet-management; Place form only references existing contacts via contactId
- **X-003: Recent loads at this facility** — Place detail page shows empty placeholder section; actual load data requires load-management to be built
- **X-004: Geocoding API fallback** — No external geocoding service if city/state not found in Redis centroids; lat/lng simply remain null with a toast notification
- **X-005: Place import/export** — No bulk CSV import or export of places
- **X-006: Place map view** — No map visualization of places; lat/lng are stored for future use
