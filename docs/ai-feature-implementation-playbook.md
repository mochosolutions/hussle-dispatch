# AI Feature Implementation Playbook

Reusable prompt and PR checklist for feature work in this monorepo.

## Golden Prompt (Copy/Paste)

Use this prompt at the start of each feature task:

```md
You are implementing: <FEATURE NAME>
Target module: <MODULE PATH>
Feature story file: /.planning/features/fleet-management/stories/BE-003.json

Before writing code, read and follow:

- /Users/jr/.claude/CLAUDE.md (global baseline)
- /CLAUDE.md (workspace/repo conventions)
- /hussle-app-dispatch-api/CLAUDE.md (API/module conventions)
- Feature implementation details from `/.planning/features/` (story JSON, acceptance criteria, validation command)

Rule precedence (highest to lowest):

1. /hussle-app-dispatch-api/CLAUDE.md
2. /CLAUDE.md
3. /Users/jr/.claude/CLAUDE.md

If any CLAUDE file cannot be loaded, stop and ask for the missing context before planning or coding.

Execution protocol (mandatory):

PRE-FLIGHT (first 10 minutes, before PHASE 1)

1. Confirm available scripts for target package (`npm run`).
2. Run quick baseline checks and record existing failures as pre-existing:
   - `npx tsc --noEmit`
   - changed-path lint (or closest equivalent)

PHASE 1 — PLAN ONLY (no code changes)

1. List exact files to create/modify.
2. List shared utilities to reuse (search existing shared utilities first).
3. Map acceptance criteria to implementation points (endpoint -> route/controller/service/repo/test).
4. Map the design to architecture rules:
   - routes -> controllers -> services -> types
   - mappers/transformers required
   - format validation in validators, business rules in services
   - services depend on ports, not repo implementations
5. Identify risks and edge cases.
6. Define exact verification sequence (focused checks first, full suite last) and note pre-existing baseline failures.
7. Stop and wait for my approval.

PHASE 2 — IMPLEMENT (after approval)

- Keep diff minimal and scoped only to this feature.
- Do not add unrelated refactors.
- Do not use any/ts-ignore/eslint-disable/type assertions/non-null assertions.
- Use typed errors only (no generic Error).
- No business logic in controllers.
- No Prisma imports in services unless existing project pattern explicitly requires and I ask for it.
- Preserve existing naming/style conventions.
- Validate in tight loops (changed-file lint/typecheck + focused tests) after each significant slice.

PHASE 3 — VERIFY
Run in this order:

1. Focused/changed-path checks:
   - changed-path lint
   - `npx tsc --noEmit`
   - focused tests for changed module
2. Required package scripts:

- npm run lint
- npm run lint:deps
- npm run check-ts
- npm test

3. If `npm run validate` exists, run it last as final gate.

Verification reporting rules:

- Clearly separate **new regressions** from **pre-existing failures**.

FINAL RESPONSE FORMAT

1. Summary of changes
2. Files changed
3. Rule compliance checklist (rule -> evidence by file)
4. Validation command results (pass/fail + reason)
5. Pre-existing failures vs newly introduced failures
6. Any open risks or follow-ups

Feature-specific constraints:
<ADD FEATURE RULES HERE>
```

## Short PR Review Checklist (Per Feature)

Copy into each PR description and check all that apply.

### Scope & Architecture

- [ ] Diff is minimal and only related to this feature.
- [ ] Layering is preserved: routes -> controllers -> services -> types.
- [ ] Controller uses mapper -> service -> transformer flow.
- [ ] Validators only enforce input format; business rules are in services.

### Dependency Rules

- [ ] Services depend on ports/interfaces (no direct repo implementation coupling).
- [ ] No new architecture violations (`lint:deps` clean).
- [ ] No circular imports introduced.

### Type Safety & Errors

- [ ] No `any`, `@ts-ignore`, `eslint-disable`, `as`, or `!`.
- [ ] Typed errors are used for expected failures.
- [ ] No `console.log`; logging follows project conventions.

### Data & Security

- [ ] Authorization and data scoping are enforced at the correct layer.
- [ ] Queries/updates are properly scoped (org/user/tenant where applicable).
- [ ] No sensitive data exposure in responses or logs.

### Quality Gates

- [ ] `npm run lint` passes.
- [ ] `npm run lint:deps` passes.
- [ ] `npm run check-ts` passes.
- [ ] `npm test` (or `npm run validate`) passes.
- [ ] Pre-existing failures are documented separately from feature regressions.

### Reviewer Notes

- [ ] Edge cases verified:
- [ ] Follow-up tasks (if any):
