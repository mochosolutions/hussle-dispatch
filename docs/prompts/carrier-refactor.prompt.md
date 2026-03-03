# Carrier Refactor Prompt (Reusable)

Use this prompt as-is whenever you want to refactor the carriers module.

```md
You are refactoring the carriers module.

Target module:
- /hussle-app-dispatch-api/src/carriers

Mandatory context loading (before planning or coding):
1) Read /CLAUDE.md
2) Read /hussle-app-dispatch-api/CLAUDE.md
3) If rules conflict, hussle-app-dispatch-api/CLAUDE.md wins

Goal:
Refactor carriers code for architecture compliance and maintainability while preserving behavior.

Behavior policy:
- Default: no behavior changes
- If behavior changes are needed, list them first and wait for approval

Execution protocol:

PHASE 1 — PLAN ONLY (NO CODE CHANGES)
- List exact files to modify/create.
- Identify existing utilities/types to reuse first (shared and module-local).
- Map proposed changes to these required patterns:
  - routes -> validators -> controllers -> mappers -> services -> transformers
  - validators: format validation only
  - services: business rules only
  - typed errors only
  - dependency direction and no forbidden imports
- Define invariants that must remain unchanged:
  - endpoint paths and HTTP methods
  - response envelope/shape
  - auth/scoping behavior
  - core business outcomes
- Provide a short risk list.
- Stop and wait for approval.

PHASE 2 — IMPLEMENT (AFTER APPROVAL)
- Apply minimal, focused diff.
- Keep public contracts stable unless explicitly approved.
- Do not include unrelated cleanup/refactors.
- No any, no ts-ignore, no eslint-disable, no type assertions, no non-null assertions.
- Keep naming and file conventions from CLAUDE.

PHASE 3 — VERIFY
Run and report:
- npm run lint
- npm run lint:deps
- npm run check-ts
- npm test
(or npm run validate)

Final response format:
1) What changed by layer (routes/controllers/services/types/repositories)
2) Invariants verification (what stayed the same)
3) Rule compliance checklist (rule -> file evidence)
4) Validation results
5) Optional follow-up items (not implemented)
```

## Optional: Incremental PR Variant

If you want smaller risk, append this to the prompt:

```md
Delivery mode: incremental
- PR 1: controller + mapper + transformer boundary cleanup only
- PR 2: service extraction/business-rule cleanup only
- PR 3: repository/port wiring cleanup only
Each PR must pass full validation and preserve behavior.
```
