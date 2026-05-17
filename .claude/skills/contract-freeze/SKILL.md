# /contract-freeze

Generate an OpenAPI contract from the plan and existing codebase patterns, then freeze it.

## Usage

```
/contract-freeze <name>
```

This runs in YOUR context — conversational for the review step.

## What This Does

1. Reads the plan and codebase patterns to understand requirements and existing conventions
2. Generates an OpenAPI contract matching those conventions (with auth matrix, enums, validation rules, error scenarios)
3. Generates data flow maps for major user actions
4. Runs a devil's advocate review on the contract
5. You review and approve
6. Writes the frozen contract and shared TypeScript types

## Procedure

### Step 0: Ensure Repository Root

All `.planning/` paths are relative to the repository root.

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"
```

### Step 1: Load Context

Read silently:

```
- .planning/<name>/plan.md (capabilities, requirements, user flows)
- .planning/codebase/packages.json (package paths, types, commands)
- Existing API source code (grep for route definitions, controllers, models to understand current patterns)
- Project CLAUDE.md (coding conventions, API patterns)
```

### Step 2: Generate Contract

Using the plan capabilities and any available template as a base, generate the OpenAPI spec.

**Cross-feature decision compliance (from ARCHITECTURE.md):**

**Match existing patterns from the codebase:**

- URL structure: `/api/org/{orgId}/<resource>` (or whatever the registry shows)
- Auth: bearerAuth security scheme
- Pagination: `?page=1&limit=20` query params, PaginationMeta in response
- Response shape: `{ data: <resource>, pagination?: PaginationMeta }`
- Error shape: ErrorBody with statusCode, error, message
- ID format: match the project's convention (e.g., `<prefix>_<nanoid>`)

**For each capability in the plan:**

- Map to CRUD endpoints as appropriate
- Define request schemas (CreateRequest, UpdateRequest)
- Define response schemas (Resource, ListResponse)
- Map error scenarios to standard error responses
- Include enums for status fields and other constrained values

**Auth & Role Matrix:**

Generate an `x-auth-matrix` custom extension for every endpoint:

```yaml
x-auth-matrix:
  - endpoint: "POST /api/org/{orgId}/invites"
    roles: [ADMIN]
    scoping: "orgId from JWT claims"
  - endpoint: "GET /api/org/{orgId}/invites"
    roles: [ADMIN, DISPATCHER]
    scoping: "orgId from JWT claims"
```

Every endpoint must have a corresponding auth matrix entry specifying which roles can access it and how org scoping is enforced.

**Explicit Enum Definitions:**

Every enum in the contract must list exact string values and display names:

```yaml
Role:
  type: string
  enum: [ADMIN, DISPATCHER, VIEWER]
  x-display-names:
    ADMIN: "Administrator"
    DISPATCHER: "Dispatcher"
    VIEWER: "Viewer"

InviteStatus:
  type: string
  enum: [PENDING, ACCEPTED, EXPIRED, REVOKED]
  x-display-names:
    PENDING: "Pending"
    ACCEPTED: "Accepted"
    EXPIRED: "Expired"
    REVOKED: "Revoked"
```

No enum may be left as just `type: string` without explicit values.

**Validation Rules:**

Include per-field constraints in every schema:

- Mark required fields in the `required` array
- Specify `format` where applicable: `email`, `uri`, `date-time`, `uuid`
- Set `maxLength`, `minLength`, `pattern` for strings
- Set `minimum`, `maximum` for numbers
- Use `pattern` for structured strings (e.g., phone numbers, IDs)

```yaml
CreateInviteRequest:
  type: object
  required: [email, role]
  properties:
    email:
      type: string
      format: email
      maxLength: 255
    role:
      $ref: '#/components/schemas/Role'
    message:
      type: string
      maxLength: 500
```

**Error Scenarios Per Endpoint:**

Go beyond generic status codes — describe the specific condition that triggers each error:

```yaml
responses:
  201:
    description: "Invite created successfully"
  400:
    description: "Invalid email format or missing required fields"
  401:
    description: "Not authenticated"
  403:
    description: "User does not have ADMIN role for this org"
  409:
    description: "Active invite already exists for this email in this org"
```

Every endpoint must have specific, actionable error descriptions rather than generic ones.

### Step 2b: Design-to-Contract Cross-Check

If `.planning/<name>/designs/` exists with design spec files, scan them for `## Visible Data Fields` tables.

For each design spec with a Visible Data Fields table:

1. Extract the `Expected API Field` column values.
2. Check each field against the response schemas in the contract.
3. Report results:

```
Design-to-Contract Cross-Check:
  dispatch-board.md:
    PASS: loadId, origin.city, destination.city, carrier.name, status
    MISSING: pickupDate — visible in design but not in response schema
```

4. Fields marked MISSING become SHOULD_DISCUSS items in Step 3:
   > "The dispatch board design shows 'pickupDate' but the contract doesn't include it. Should we add it to the LoadResponse schema?"

### Step 2c: Data Flow Map

After contract generation, create an `x-data-flow` extension documenting the end-to-end flow for each major user action from the plan:

```yaml
x-data-flow:
  "Create Invite":
    trigger: "Admin submits invite form"
    steps:
      - "Frontend: POST /api/org/{orgId}/invites with { email, role }"
      - "Backend: inviteService.create() validates, creates DB record"
      - "Backend: emailService.send() renders template, sends"
      - "Backend: returns 201 with Invite object"
      - "Frontend: shows success toast, refreshes list"
    services: [dispatch-ui, dispatch-api]

  "Accept Invite":
    trigger: "Invited user clicks accept link in email"
    steps:
      - "Frontend: GET /api/invites/{token}/accept (token from email link)"
      - "Backend: inviteService.accept() validates token, checks expiry"
      - "Backend: userService.create() creates user record with role"
      - "Backend: inviteService.markAccepted() updates invite status"
      - "Backend: returns 200 with redirect URL"
    services: [dispatch-ui, dispatch-api]
```

Generate one flow per major user action identified in the plan. Each flow must reference the actual endpoints from the contract.

### Step 3: Devil's Advocate Review

Review the contract against common issues. Categorize findings:

**MUST_FIX (add automatically, don't ask):**

- Missing auth on endpoints
- Missing pagination on list endpoints
- Missing error responses for obvious failure paths (404 on get-by-id, 400 on invalid input)
- Schema inconsistencies (field name in request doesn't match response)
- Missing required fields
- Enums without explicit values
- Missing validation constraints on user-facing input fields
- Auth matrix entries missing for any endpoint

**SHOULD_DISCUSS (present to user):**

- Endpoint design choices (should X be a sub-resource or top-level?)
- Filter parameters (which filters are needed on list endpoints?)
- Soft delete vs hard delete
- Bulk operation endpoints (needed now or later?)
- Webhook/event needs
- Role assignments (should an endpoint be more or less restrictive?)

**SKIP (mention briefly, don't block):**

- Future API versioning
- Rate limiting details
- Advanced search/full-text search
- GraphQL alternative

Present SHOULD_DISCUSS items conversationally:

> "A few design questions about the contract before we freeze it:
> 1. Should shifts support soft delete (status -> 'cancelled') or hard delete (DELETE endpoint)?
> 2. Do you need filters on the list endpoint? Status, date range, facility?
> 3. Any bulk operations needed (bulk create, bulk status update)?"

### Step 4: User Review

Present the contract summary as a readable table (not the full YAML):

```
| Method | Endpoint                          | Request Body     | Success | Errors          |
|--------|-----------------------------------|------------------|---------|-----------------|
| POST   | /org/{orgId}/shifts               | CreateShiftReq   | 201     | 400, 401, 409   |
| GET    | /org/{orgId}/shifts               | —                | 200     | 401             |
| GET    | /org/{orgId}/shifts/{shiftId}     | —                | 200     | 401, 404        |
| PUT    | /org/{orgId}/shifts/{shiftId}     | UpdateShiftReq   | 200     | 400, 401, 404   |
| DELETE | /org/{orgId}/shifts/{shiftId}     | —                | 204     | 401, 404        |
```

Plus schema summary:

```
Schemas:
  Shift: id, orgId, facilityId, startTime, endTime, status, createdAt, updatedAt
  CreateShiftRequest: facilityId (required), startTime (required), endTime (required), notes
  UpdateShiftRequest: facilityId, startTime, endTime, status, notes (all optional)
  ShiftListResponse: { data: Shift[], pagination: PaginationMeta }
```

**Auth Matrix:**

```
| Endpoint                          | Roles              | Scoping              |
|-----------------------------------|--------------------|----------------------|
| POST /org/{orgId}/shifts          | ADMIN, DISPATCHER  | orgId from JWT       |
| GET /org/{orgId}/shifts           | ADMIN, DISPATCHER, VIEWER | orgId from JWT |
| GET /org/{orgId}/shifts/{shiftId} | ADMIN, DISPATCHER, VIEWER | orgId from JWT |
| PUT /org/{orgId}/shifts/{shiftId} | ADMIN, DISPATCHER  | orgId from JWT       |
| DELETE /org/{orgId}/shifts/{shiftId} | ADMIN           | orgId from JWT       |
```

**Enums:**

```
  Role: ADMIN | DISPATCHER | VIEWER
  ShiftStatus: DRAFT | PUBLISHED | IN_PROGRESS | COMPLETED | CANCELLED
```

**Data Flows:**

```
  Create Shift (5 steps), Publish Shift (4 steps), Cancel Shift (4 steps)
```

**Breaking change detection (re-run only):**

If a contract.yaml already exists at the output path, compare the new contract against it:

- **Breaking:** removed endpoints, removed required fields, changed field types, changed response structure
- **Non-breaking:** added endpoints, added optional fields, added optional query params

If breaking changes are detected, present them clearly:

> "Breaking changes detected vs the existing contract:
> - [list of breaking changes]
> These are significant — confirm you want to proceed."

Ask for approval:

> "Contract ready to freeze. Any changes?"

### Step 5: Write Contract

Write the OpenAPI YAML to:

```
.planning/<name>/contract.yaml
```

This is the single source of truth. If changes are needed later, update the YAML directly or re-run `/contract-freeze`.

### Step 5b: Generate Shared Types

Generate `.planning/<name>/types.ts` from the contract:

- TypeScript string enums from every OpenAPI enum schema
- TypeScript interfaces from every OpenAPI object schema
- Request and response types for each endpoint
- Header comment: `// Auto-generated from contract.yaml — DO NOT EDIT MANUALLY`

```typescript
// Auto-generated from contract.yaml — DO NOT EDIT MANUALLY

export enum Role {
  ADMIN = 'ADMIN',
  DISPATCHER = 'DISPATCHER',
  VIEWER = 'VIEWER',
}

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export interface Invite {
  id: string;
  orgId: string;
  email: string;
  role: Role;
  status: InviteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInviteRequest {
  email: string;
  role: Role;
  message?: string;
}

export interface InviteListResponse {
  data: Invite[];
  pagination: PaginationMeta;
}
```

Rules for type generation:

- Enums use string values matching the OpenAPI `enum` array
- `required` fields are non-optional; all others use `?`
- `$ref` references resolve to the corresponding interface or enum
- `date-time` format maps to `string` (not `Date`)
- Array types use `Type[]` syntax
- Nested objects get their own interface

### Step 6: Commit

```bash
git add .planning/<name>/contract.yaml .planning/<name>/types.ts
git commit -m "feat(<name>): freeze API contract and generate shared types"
```

### Step 7: Report

```
Contract frozen:
  Endpoints: [count]
  Schemas: [count]
  Enums: [count with values listed]
  Auth matrix: [count] protected endpoints
  Data flows: [count]
  File: .planning/<name>/contract.yaml
  Shared types: .planning/<name>/types.ts

Next steps:
  /design <name>  — (optional) Design UI screens
  /build <name>   — Break plan into tasks and start building
```

## Notes

- The contract is the source of truth for both backend and frontend during parallel implementation.
- Frontend generates TypeScript types from the contract schemas — this is the coupling point, not code imports.
- The `types.ts` file provides immediate type-safety for both sides without waiting for codegen tooling.
- If the contract needs changes after freeze, update the YAML and re-run `/contract-freeze` to get a fresh review and regenerate types.
- The `/build` skill handles task orchestration including integration work.
- The `x-auth-matrix` extension drives middleware generation and test assertions during build.
- The `x-data-flow` extension helps developers understand the full picture before building individual pieces.
