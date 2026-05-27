# /improve

Lightweight path for improvements, bug fixes, refactors, and enhancements to existing code.

## Usage

```
/improve
```

No arguments. Conversational -- describe what needs to change.

## When to Use /improve vs /feature-init

| Use /improve | Use /feature-init |
|-------------|-------------------|
| Bug fix | New feature with multiple screens |
| Add filter/column to existing page | New API resource (new model, new endpoints) |
| Refactor existing service | Feature requiring a new contract |
| Small enhancement to existing feature | Work spanning many task groups |
| Tech debt cleanup | New user flows from scratch |

**Complexity gate:** If the improvement requires new API resources, new database models,
new pages, or grows beyond what a quick plan can cover, recommend the full flow:

> "This needs new API endpoints and a database model. I'd recommend /feature-init +
> /prd-refine + /build for this. Want me to set that up?"

## Express Mode

For trivial changes (3 or fewer files), implement directly in the current context.

### Express Criteria

All must be true:
- 3 or fewer files affected
- Does not add new API endpoints, DB models, or pages
- Does not touch shared code used by other packages

User can force express mode ("just do it quick") or opt out ("use the full flow").

### Express Procedure (5 steps)

1. **Scope** -- Read relevant code, identify what changes, confirm with user in one round.

2. **Before/After Assertion (MANDATORY — capture before any edit).** Even Express Mode gets a one-line goal-backward contract. Capture in chat as:

   ```
   Before: [the broken behavior, as the user would observe it]
   After:  [what should now be true once the fix lands]
   ```

   This is the single observable truth the fix must achieve. Save it to `.planning/{slug}/ASSERTION.md` if a planning dir exists, otherwise echo it back to the user and proceed.

3. **Branch** -- `git checkout -b improve/{slug}`.

4. **Implement** -- Make changes directly. No subagents, no workspace files.

5. **Validate, verify against assertion, & commit.** Run related tests only (not the full suite). Re-state the After assertion and confirm in the chat the fix matches it. Commit:
   ```bash
   git add <changed-files>
   git commit -m "fix(<scope>): <description>"
   ```

That's it. The assertion is the only ceremony — and it's the difference between "shipped a thing" and "shipped a verified thing."

---

## Standard Mode

For anything beyond express: multiple files, cross-package changes, needs a plan.

### Phase 1: Discovery (Conversational)

**Step 1: Understand the request**

> "What needs to change? Describe the bug, improvement, or refactor."

**Step 2: Search the codebase**

Find the relevant code. Use grep, glob, or project knowledge to locate the files involved.

**Step 3: Check for feature context**

If a related `.planning/{feature}/` directory exists, read any planning docs to understand
original intent and decisions. This is optional context -- /improve works without it.

**Step 4: Read the actual code**

Read the files that need to change. Understand current implementation before proposing changes.

**Step 5: Scope the change**

Present findings and propose the scope:

> "I found the shift list page at src/pages/shifts/ShiftListPage.tsx. It uses the useShifts
> hook which calls GET /api/org/{orgId}/shifts. The endpoint supports ?status and ?page but
> not date range.
>
> To add date filtering, we need to:
> 1. Add startDate/endDate query params to the shift list endpoint
> 2. Add date range picker to the filter bar
>
> Should I proceed?"

### Phase 2: Plan

Create a lightweight workspace:

```bash
SLUG="<slug>"
mkdir -p ".planning/$SLUG"
```

Write `.planning/{slug}/tasks.md` with the plan:

```markdown
# Improvement: Add date filter to shift list

**Date:** {YYYY-MM-DD}
**Branch:** improve/{slug}

## Summary
[2-3 sentences describing the improvement]

## must_haves
truths:
  - "Shift list filters server-side by startDate and endDate range (verified via network tab)"
  - "[Add one truth per behavior the improvement adds]"
artifacts:
  - path: hussle-app-dispatch-api/src/shifts/services/shiftService.ts
    provides: "list method accepts startDate/endDate filters"
  - path: hussle-app-dispatch-ui/src/features/shift/components/FilterBar.tsx
    provides: "date range picker wired to query params"
key_links:
  - from: FilterBar
    to: useShifts hook
    via: "query params pass through to GET /shifts"
  - from: shiftService.list
    to: shiftRepository.findMany
    via: "Prisma where clause filters by date range"

## Tasks

### Backend
- [ ] Add startDate/endDate query params to shift list endpoint
  - Files: [hussle-app-dispatch-api/src/shifts/services/shiftService.ts, hussle-app-dispatch-api/src/shifts/validators/listShiftsValidator.ts]
- [ ] Add date validation (400 on invalid format, startDate > endDate)
  - Files: [hussle-app-dispatch-api/src/shifts/validators/listShiftsValidator.ts]

### Frontend
- [ ] Add date range picker to shift list filter bar
  - Files: [hussle-app-dispatch-ui/src/features/shift/components/FilterBar.tsx]
- [ ] Wire picker to API query params
  - Files: [hussle-app-dispatch-ui/src/features/shift/hooks/useShifts.ts]

### Testing
- [ ] Add endpoint tests for date filtering
- [ ] Verify existing tests still pass
```

**Rules:**
- The `must_haves` block is MANDATORY in Standard Mode. /improve features that ship without it cannot be verified by `/feature-verify`, which means regressions can hide.
- `Files:` arrays on tasks mirror `/build` STEP 3 — feeds the same file-overlap detection logic.
- Match the `must_haves` schema used in `/build` user stories so `/feature-verify <slug>` can parse improve workspaces with the same code path.

### Phase 3: Branch and Build

```bash
git checkout -b "improve/$SLUG"
```

Then run `/build` to execute the plan. The build skill reads `.planning/{slug}/tasks.md`
and works through the tasks.

### Phase 4: Validate

After all tasks complete, run tests for affected packages:

```bash
# Run tests for each affected package
# Run typecheck/lint for each affected package
```

On failure, read the output and fix. Full monorepo validation belongs in CI.

### Phase 5: Close

Verify all tasks in `.planning/{slug}/tasks.md` are marked `[x]`.

Final commit:

```bash
git add .planning/$SLUG/
git commit -m "chore: close improvement -- $SLUG"
```

Report:

```
Improvement complete.
  Tasks: {count} done
  Validation: pass
  Branch: improve/{slug} ready for PR
```

---

## How /improve Discovers Existing Code

Two layers, in order:

### Layer 1: Project Knowledge

Use grep, glob, and any project documentation to find relevant files. When the user says
"the shift list page needs a filter," search for shift-related files across the codebase.

### Layer 2: Direct Code Reading

After finding files, read the actual source. This is always done -- file search says where
to look, the code says what is actually there.

---

## Branch and Commit Conventions

| Aspect | Convention |
|--------|-----------|
| Branch | `improve/{slug}` |
| Fix commit | `fix({scope}): {description}` |
| Improvement commit | `improve({scope}): {description}` |
| Refactor commit | `refactor({scope}): {description}` |
| Closing commit | `chore: close improvement -- {slug}` |

## Next Steps

After completing an improvement:

**Express mode:**
```
Next steps:
  Improvement complete. Push and create PR when ready.
  git push origin improve/{slug}
```

**Standard mode (delegated to /build):**
```
Next steps:
  /build {slug}            — Execute the improvement tasks
  /feature-verify {slug}   — Confirm must_haves are achieved (goal-backward check)
  /feature-done {slug}     — Generate PR summary when verified
```
