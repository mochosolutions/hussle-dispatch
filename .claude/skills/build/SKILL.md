# /build

Task orchestrator. Takes a plan document, breaks it into user stories with acceptance criteria, generates grounded tasks, and executes them group by group using subagents. Tracks cross-task context via a running summary. Auto-generates integration and verification stories from the contract.

## Usage

```
/build <plan-name>
```

Where `<plan-name>` matches the directory name under `.planning/`.

## File Paths

| Purpose | Path |
|---------|------|
| Plan input | `.planning/{name}/plan.md` |
| Task file (output & state) | `.planning/{name}/tasks.md` |
| Contract reference | `.planning/{name}/contract.yaml` (if exists) |
| Shared types | `.planning/{name}/types.ts` (if exists) |
| Design specs | `.planning/{name}/designs/` (if exists) |
| Packages info | `.planning/codebase/packages.json` (for validation commands) |
| Registry index | `.planning/codebase/REGISTRY.md` (package overview) |
| Package registries | `.planning/codebase/REGISTRY-{key}.md` (per-package code inventory) |
| Architecture | `.planning/codebase/ARCHITECTURE.md` (system overview) |
| Agent templates | `.claude/agents/` (in the project) or `.claude/agents/` (in workflow-integration) |

---

## Agent Prompt Templates

When dispatching a subagent, select the appropriate agent template from `.claude/agents/` based on task type:

| Task type | Template file |
|-----------|---------------|
| Backend (API, DB, services) | `.claude/agents/backend-coder.md` |
| Frontend (UI, components, pages) | `.claude/agents/frontend-coder.md` |
| Review | `.claude/agents/code-reviewer.md` |
| Generic (setup, config, docs) | No template — base prompt only |

Read the template file and include its full content in the subagent prompt so the agent has the patterns and conventions available in its context.

---

## Validation Strategy

Three tiers — escalating scope, escalating cost.

### Per-Story (subagent responsibility)

Each story's subagent runs `testRelated` on its changed files after completing all tasks. The `testRelated` command comes from `.planning/codebase/packages.json` for the affected package. Never run the full test suite per-story.

### Per-Story (orchestrator responsibility)

After a story completes, the orchestrator runs the affected package's `test` and `typecheck` commands. Do this before pausing for user review. Redirect output to `/tmp/build-story-{story-id}.log` and report pass/fail summary only.

### Full Suite (user-triggered only)

Only run the full monorepo validation on explicit user request or as an optional final task group. Never run it automatically.

---

## Task File Format

The task file at `.planning/{name}/tasks.md` is the single source of truth. It is organized by **user stories**, not flat task lists. Each story contains acceptance criteria and its own tasks.

```markdown
# {Feature Name} Tasks
_Last updated: {YYYY-MM-DD HH:MM}_
_Contract: .planning/{name}/contract.yaml_
_Shared types: .planning/{name}/types.ts_

---

## US-01: [Story title — user-facing capability]
_Priority: P0 | Services: api, dispatch-ui | Agent: backend | Status: in-progress_

must_haves:
  truths:
    - "Observable behavior: what must be TRUE for this story to be done"
  artifacts:
    - path: src/path/to/file.ts
      provides: "what this file delivers (one line)"
  key_links:
    - from: ConsumerSymbol
      to: ProducerSymbol
      via: "how they connect (import, dispatch, fetch, etc.)"

**Acceptance Criteria:**
- [ ] AC item 1
- [ ] AC item 2

**Tasks:**
[x] T-01 [GROUP] Description
         └─ Detail: ...
         └─ Files: [path/to/file1.ts, path/to/file2.ts]
         └─ Depends on: —
         └─ Output: {structured report}

[ ] T-02 [GROUP] Description
         └─ Detail: ...
         └─ Files: [path/to/file3.ts]
         └─ Depends on: T-01
         └─ Output:

---

## US-02: [Another user-facing capability]
_Priority: P1 | Services: api | Agent: trivial | Status: todo_

**Acceptance Criteria:**
- [ ] AC item 1

**Tasks:**
[ ] T-03 [GROUP] Description
         └─ Detail: ...
         └─ Depends on: —
         └─ Output:

---

## INT-01: Wire backend-frontend integration
_Auto-generated | Services: api, dispatch-ui_

**Verification Checklist:**
- [ ] Frontend API client calls correct endpoints (from contract)
- [ ] Request/response shapes match types.ts
- [ ] Enum values match types.ts character-for-character
- [ ] Auth roles enforced per auth matrix
- [ ] Error handling matches contract error scenarios
- [ ] Data flow: every step in x-data-flow is connected

**Tasks:**
[ ] T-10 [WIRE] Verify API integration against contract
         └─ Detail: Read contract.yaml, types.ts, backend + frontend source.
            Compare endpoint paths, request/response shapes, enum values,
            auth rules, and error handling against the contract spec.
         └─ Agent: backend
         └─ Depends on: [all implementation tasks for this service pair]
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[ ] T-12 [VERIFY] Trace complete feature flow
         └─ Detail: For each flow in contract x-data-flow, trace every step
            from trigger through API through DB and back to UI response.
            Check every AC from every story is satisfied.
         └─ Agent: review
         └─ Depends on: [all WIRE tasks]
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 2     | 1    | 0       | 0/2    |
| US-02 | 1     | 0    | 0       | 0/1    |
| INT-01| 1     | 0    | 0       | —      |
| VER-01| 1     | 0    | 0       | —      |
| **All** | **5** | **1** | **0** | **0/3** |
```

### Status markers

| Marker | Meaning |
|--------|---------|
| `[ ]` | Todo — not started |
| `[~]` | In progress — subagent working |
| `[x]` | Done — completed successfully |
| `[!]` | Blocked — dependency failed or task errored |

---

## Procedure

### STEP 1 — Determine Plan Name & File Path

Extract the plan name from the argument. It must match a directory under `.planning/`.

```
Plan name:  {name}
Plan file:  .planning/{name}/plan.md
Task file:  .planning/{name}/tasks.md
Contract:   .planning/{name}/contract.yaml
Types:      .planning/{name}/types.ts
```

Verify `.planning/{name}/plan.md` exists. If not, give the user explicit next-action guidance:

```
If .planning/{name}/ exists (feature dir created by /feature-init):
  Print: "plan.md not found in .planning/{name}/.
          Next: run /prd-refine {name} first to generate the plan, then re-run /build {name}."
  Stop.

If .planning/{name}/ does NOT exist (no prior init):
  Print: "Feature {name} has no planning directory.
          Next: run /feature-init {name} to create the branch + directory, then /prd-refine {name}."
  Stop.
```

Never stop with a vague "plan.md missing" — always name the specific skill the user should run next.

### STEP 2 — Check for Existing Task File

If `.planning/{name}/tasks.md` already exists:

1. Read the task file.
2. Print current status — how many tasks done, blocked, remaining per story.
3. Identify the first story with incomplete tasks.
4. Skip to STEP 4, resuming from that story.

**Mid-story resume rule (CRITICAL — prevents re-running already-done work):**

When resuming a story with mixed status markers (some `[x]`, some `[ ]/[!]`):

- DO NOT re-mark completed `[x]` tasks as `[~]` in-progress. They stay `[x]`.
- DO NOT instruct the subagent to re-execute them.
- The dispatch prompt for the resumed story (STEP 4 c2) MUST mark every `[x]` task as `[ALREADY DONE — context only, DO NOT execute]` with its prior Output report verbatim.
- The subagent's first execution target is the first `[ ]` or `[!]` task in the story.
- Re-execution of `[x]` tasks is a regression. If you find yourself instructing an agent to redo a done task, you have violated this rule.

If the task file does not exist, proceed to STEP 3.

### STEP 3 — Break Plan Into Stories & Tasks

**Load context before creating tasks:**

1. Read `.planning/{name}/plan.md` (the plan to implement)
2. Read `.planning/codebase/REGISTRY.md` (what packages exist, what's in each)
3. Read ALL `REGISTRY-{key}.md` files (component inventories, signatures, patterns)
4. Read `.planning/{name}/contract.yaml` if it exists (API spec, auth matrix, data flows)
5. Read `.planning/{name}/types.ts` if it exists (shared type definitions, enums)
6. Read `.planning/{name}/designs/` if they exist (UI specs)
7. Read `.planning/codebase/ARCHITECTURE.md` if it exists (system topology)

**Use contract, types, and registry knowledge to write grounded tasks.** Every task should reference specific endpoints, types, components, hooks, utilities, and patterns from these sources. Instead of vague descriptions, name exact things:

```
VAGUE (bad):
T-05 [UI] Build carrier list page
  └─ Detail: Create a page that lists carriers with search and pagination

GROUNDED (good):
T-05 [UI] Build carrier list page
  └─ Detail: Create CarrierListPage at src/pages/carriers/CarrierListPage.tsx
     - Use PageWrapper, PageHeader, MainCard from @mocho/ui
     - Use createEntityModule for Redux state (see REGISTRY-mocho-ui.md § Redux Utilities)
     - GET /api/carriers endpoint returns CarrierListResponse (see contract.yaml § /carriers)
     - Use CarrierStatus enum from types.ts (ACTIVE | INACTIVE | PENDING)
     - Auth: requires ADMIN or DISPATCHER role (see contract auth matrix)
     - Data grid with ActionsCell factory from @mocho/ui
     - States: loading (ListSkeleton), empty (EmptyState), error (ErrorState)
     - Follow the load list page pattern from REGISTRY-dispatch-ui.md § Page/Route Pattern
```

**Story creation rules:**

1. Break the plan into **user stories** based on user-facing capabilities.
2. Each story has: title, priority (P0/P1/P2), affected services, acceptance criteria.
3. Derive AC from: plan.md requirements + contract auth matrix + contract error scenarios.
4. Reference contract.yaml and types.ts in task Detail lines wherever applicable.
5. **Every non-trivial story MUST include a `must_haves` block** with at least one entry in each of `truths`, `artifacts`, and `key_links`.
   - **truths** = observable behaviors that must be TRUE when the story is done. Stub-resistant — "endpoint exists" is NOT a truth; "POST returns 201 with the new resource ID" is.
   - **artifacts** = files that must exist with substantive content. List path + one-line `provides`.
   - **key_links** = wiring between artifacts. Each entry names the `from` symbol, the `to` symbol, and `via` (import / dispatch / fetch / event / etc.). Most goal-misses hide in missing wiring.
   - **Trivial stories** (orchestrator-direct execution) are exempt from `artifacts` and `key_links`, BUT must still include ONE `truths` entry. No story ships without a single observable behavior contract.
6. **Cross-story file overlap rule.** If two stories' `Files:` lists share any path, the orchestrator MUST either: (a) merge the stories into one (preferred when both stories are owned by the same agent type), or (b) declare an explicit `passes_state_to:` dependency on the upstream story. Surface the overlap to the user during STEP 3 confirmation with a one-line warning per shared file. Never silently dispatch two subagents that will re-Read the same file.
7. **Files: lists are mandatory on every task.** A task without a `Files:` array is not a valid task — the orchestrator must derive the list from the plan + registry before story confirmation. Empty `Files: []` is allowed only for SETUP-style tasks (e.g., `npm install`, env var setup) that touch no source.

**Task rules within stories:**

- **Checklist items, not agent dispatches:** Tasks are a checklist for the story's single agent dispatch. Each task is a discrete unit of work within the story, but the ENTIRE story is executed by ONE subagent (or by the orchestrator for trivial stories). Do not design tasks as independent agent dispatches.
- **Identified:** sequential IDs across all stories — T-01, T-02, T-03...
- **Labelled:** status marker `[ ]` for all new tasks.
- **Tagged:** group label matching the work type. Common groups: SETUP, TYPES, DB, API, AUTH, WIRE, UI, INFRA, TEST, DOCS — use whatever fits the plan. Not every group is needed.
- **Story agent role:** each story declares ONE agent type based on the dominant work type. All tasks within a story should be executable by the same agent type. If a story would require both backend and frontend agents, split it into separate stories.
  - `backend` — writes API routes, services, models, migrations, server-side logic
  - `frontend` — writes React components, pages, hooks, Redux slices, UI tests
  - `review` — reads code and produces a review report (no implementation)
  - `trivial` — simple changes the orchestrator handles directly (see below)
- **Ordered:** foundational work first. SETUP before TYPES before API before WIRE before UI.
- **Dependencies declared:** story-level cross-dependencies are declared per-task where needed. All tasks within a story are assumed sequential.
- **Detail filled:** the Detail line must contain enough information to execute without reading the plan. Include file paths, function names, endpoint routes, schema shapes, relevant types from types.ts, and auth rules from the contract.

**Trivial story classification:**

A story is `trivial` when ALL of its tasks meet these criteria:
- Single-line or few-line changes (adding an enum value, adding an event to a map, adding an import, running `npm install`)
- No business logic, no new patterns, no architectural decisions
- The change is fully specified in the task Detail with no ambiguity
- **The story has exactly ONE task.** Stories with more than one task are NEVER trivial, regardless of how simple each task seems. Multi-task stories warrant a subagent dispatch.

Trivial stories are executed DIRECTLY by the orchestrator — no subagent is spawned. This avoids the ~25-30k token overhead of agent context for work that takes seconds. Examples: adding a value to an enum, adding an event type to EventMap, running `npm install`, creating a Prisma migration.

**Trivial stories still require `must_haves.truths`.** A trivial story without a truth is not a valid story — even single-line changes have an observable contract (e.g., "the new enum value is importable", "the package version in lockfile matches request"). The trivial exemption is from `artifacts` and `key_links`, not from `truths`.

**Mandatory auto-generated stories:**

After creating all implementation stories, automatically generate:

1. **INT-{N}: Wire {package-A}-{package-B} integration** — one per pair of communicating packages.
   - Verification checklist derived from contract: endpoint correctness, type matching, enum matching, auth enforcement, error handling, data flow connectivity.
   - Contains WIRE tasks that compare actual code against types.ts and contract.yaml.

2. **VER-01: End-to-end verification** — single verification story.
   - Traces every data flow from contract x-data-flow.
   - Checks every AC from every story.
   - Agent: review (read-only).

**WIRE task generation rules:**
- For every API endpoint a frontend package consumes, create a WIRE task.
- WIRE tasks compare types, enums, and request/response shapes against types.ts.
- WIRE tasks depend on BOTH the producer (backend) and consumer (frontend) implementation tasks.

**VERIFY task rules:**
- Depends on ALL WIRE tasks.
- Agent: review (read-only).
- Checks every AC from every story is satisfied.
- Traces every data flow step from contract x-data-flow.

If the plan is ambiguous on any point, ask **one** clarifying question before breaking into stories/tasks. Do not guess.

**Generate file-matrix.md (mandatory before user confirmation):**

After creating all stories and tasks, build a story×file matrix from each task's `Files:` list and write `.planning/{name}/file-matrix.md`:

```markdown
# {Feature Name} — Story × File Matrix
_Generated by /build on {YYYY-MM-DD}. Overlap (multiple cells in a row) = stories that touch the same file._

| File | US-01 | US-02 | US-03 | INT-01 |
|---|---|---|---|---|
| src/feature/Service.ts | T-02 | T-05 | — | — |
| src/feature/routes.ts | T-03 | — | T-08 | T-10 |
| src/feature/Page.tsx | — | T-06 | — | — |
```

**Surface overlaps before user confirmation.** For every row with more than one non-empty cell, print a one-line warning:

```
⚠ src/feature/Service.ts is touched by US-01 (T-02) and US-02 (T-05).
  Action: merge stories OR add `passes_state_to: US-01` to US-02.
```

Apply the chosen resolution (merge or `passes_state_to`) BEFORE writing tasks.md. The user confirms the resolved task list, not the raw one.

Write the task file to `.planning/{name}/tasks.md` with all stories, tasks, and summary table. Print the task list (plus file-matrix path) for user review. Do not execute anything yet — wait for user confirmation to proceed.

### STEP 4 — Execute Stories

Process stories in order. **Each story is ONE execution unit** — either a single subagent dispatch or direct orchestrator execution for trivial stories.

**a) Announce the story**

```
��─ US-01: Invite team members (3 tasks) ──────────────────
```

**b) Check story-level dependencies**

Check if any task in this story depends on tasks from a previous story that are not `[x]` done. If so, mark the entire story `[!]` blocked and move to the next story.

**c) Classify the story**

- If the story is tagged `trivial` → execute directly (see **c1** below)
- Otherwise → dispatch a subagent (see **c2** below)

**c1) Trivial story — orchestrator executes directly**

For trivial stories, the orchestrator executes each task itself using Edit, Write, Bash, etc. No subagent is spawned. This saves ~25-30k tokens of agent boot overhead per trivial story.

1. Mark all tasks `[~]` in the task file.
2. Execute each task sequentially using tools directly.
3. Mark each task `[x]` as completed, fill Output lines.
4. Append to the Completed Tasks Summary.
5. Update the task file.

**c2) Substantial story — single subagent dispatch**

One agent handles ALL tasks in the story as a checklist.

1. **Mark incomplete tasks `[~]` in-progress.** Tasks already `[x]` MUST stay `[x]` — never regress a completed task to in-progress. Update the task file. (Mid-story resume: see STEP 2 rule.)

2. **Read the agent template** for the story's agent type:
   - `backend` → read `.claude/agents/backend-coder.md`
   - `frontend` ��� read `.claude/agents/frontend-coder.md`
   - `review` → read `.claude/agents/code-reviewer.md`

3. **Assemble context and spawn ONE subagent for the entire story:**

   ```
   You are a subagent. Execute ALL of the following tasks in order.

   ## Agent Role
   {full content of the relevant agent template from .claude/agents/}

   ## Codebase Context
   {content of REGISTRY-{relevant-package}.md — the package this story modifies}
   {content of REGISTRY-{shared-package}.md — if the story uses shared components/utils}

   ## Contract Reference
   {relevant excerpt from .planning/{name}/contract.yaml — only endpoints related to this story}

   ## Shared Types
   {relevant excerpt from .planning/{name}/types.ts — types, enums, interfaces used by this story}

   ## Auth Matrix
   {relevant auth rules from contract — which roles can access the endpoints this story touches}

   ## Design Reference
   {relevant excerpt from .planning/{name}/designs/{screen}.md — if this is a UI story}

   ## Prior Context
   {Completed Tasks Summary — ONLY entries from stories in the transitive `depends_on:` closure of this story. See context scoping rules below.}
   {OMIT this section entirely if transitive_deps is empty.}

   ## Prior Files (only if story has `passes_state_to:` from upstream)
   {For each file the upstream story wrote/modified that THIS story also touches:
   - File path
   - Current contents as of the upstream commit, fetched via `git show <commit>:<path>`
   - One-line note: "Upstream {US-XX} produced this file at commit {sha}. Read this, do NOT re-Read from disk."}

   ## Story must_haves (goal-backward contract)
   {full must_haves block from the story — truths, artifacts, key_links}
   {if the story is trivial, include the single truths entry only}

   ## Patterns Reference
   {relevant rows from .planning/{name}/PATTERNS.md — the closest in-tree analog for each file this story touches}

   ## Tasks (execute in order)

   ### T-01 [GROUP] Description  [ALREADY DONE — context only, DO NOT execute]
   {full Detail line + Output report from prior dispatch — verbatim}

   ### T-02 [GROUP] Description
   {full Detail line — first incomplete task — agent starts execution HERE}

   ... (remaining tasks in this story)

   **Note for resumed stories:** any task marked `[ALREADY DONE — context only, DO NOT execute]` exists for grounding only. Treat its Output as ground truth (read what was produced; don't re-derive it). Start execution at the first task NOT marked `[ALREADY DONE]`.

   ## Instructions
   - Execute each task in order. If a task fails, note the failure and continue to the next task if possible.
   - After all tasks, run testRelated on your changed files. Do NOT run the full test suite.
   - Redirect any bash output over 5 lines to /tmp/.
   - Return a structured output report PER TASK:

   ### T-01 Report
     Files: {list of files created/changed}
     Exports: {types, functions, components exported}
     Enums: {enum values if any — note if they match types.ts}
     Status: DONE | FAILED
     Issues: {any problems found, "NOT YET WIRED" flags, or "None"}

   ### T-02 Report
     ...
   ```

   **Context scoping rules (reduces token waste):**
   - **Registry:** include ONLY the registry for the package this story modifies. Backend stories get REGISTRY-dispatch-api.md. Frontend stories get REGISTRY-dispatch-ui.md. Review stories get all registries.
   - **Contract/types/auth:** include ONLY the sections relevant to this story's endpoints, not the full spec.
   - **Prior Context (Completed Tasks Summary) — MANDATORY DEPENDENCY-ONLY INCLUSION:**
     1. Compute `transitive_deps` = the full closure of `current_story.depends_on` (deps of deps of deps).
     2. Include ONLY summaries for stories in `transitive_deps`.
     3. If `transitive_deps` is empty, OMIT the Prior Context section entirely.
     4. Do NOT include summaries from unrelated stories — even if "interesting" or "recent." This is not advisory; the orchestrator carries those summaries on disk and can re-include on demand, but they MUST NOT enter the subagent prompt unless the dependency chain warrants it.
   - **Prior Files (passes_state_to):** if the story declares `passes_state_to: US-XX`, fetch the file content from the upstream story's commit via `git show <upstream-commit>:<path>` for every file the new story will also touch. Inline that content under "Prior Files" so the subagent does not need to Read it from disk.

4. **On completion:** parse the per-task reports from the subagent output:
   - Mark each task `[x]` done or `[!]` failed based on its Status.
   - Fill each task's Output line with its report.
   - Append all task summaries to the running **Completed Tasks Summary**.

5. **Check for integration gaps.** After parsing reports:
   - Look for "NOT YET WIRED" or "Issues" lines.
   - Check if an existing WIRE task already covers the gap.
   - If not, auto-create a new WIRE task in the appropriate INT story and update the task file.

6. **On story failure:** if ANY task in the story failed, mark the story status as `partial`. Downstream stories that depend on failed tasks are marked `[!]` blocked.

7. **Update the task file.** Refresh the `_Last updated_` timestamp. Recalculate the summary table.

**c) After the story's tasks complete**

1. **Run per-group validation.** Execute the affected package's `test` and `typecheck` commands. Redirect output to `/tmp/build-story-{story-id}.log`. Report pass/fail only.

2. **Check acceptance criteria.** Review the story's AC against completed task outputs. Mark AC checkboxes as met where applicable.

3. **Print story report:**
   ```
   ── US-01 complete ─────────────────────────────
   Done: 3 | Blocked: 0 | AC: 2/2 met | Validation: PASS
   ```

4. **Print updated summary table** from the task file.

5. **Ask the user:**
   - `continue` → proceed to next story
   - `skip` → skip the next story entirely
   - `stop` → pause the session (go to STEP 5)

### STEP 5 — Session End or Pause

When all stories are done or the user says "stop":

1. Print the final summary table.
2. List any `[!]` blocked tasks with their error output.
3. Print the task file path: `.planning/{name}/tasks.md`
4. Print next steps based on state:

```
All tasks done, no issues:
  Next: /feature-verify {name} — Goal-backward check against must_haves
        /feature-done {name}   — Generate PR summary

All tasks done, but bugs/issues found:
  Next: Describe the issues and I'll add FIX tasks, then /build {name} to execute them

Blocked tasks exist:
  Next: Fix the blockers, then /build {name} to resume

User stopped mid-build:
  Next: /build {name} to resume from story {next-story}
```

### STEP 6 — Fix Loop (when re-running after issues)

When the user re-runs `/build {name}` and all original tasks are `[x]` done but they report bugs or issues:

1. **Ask what's wrong.** Use AskUserQuestion:
   ```
   AskUserQuestion:
     question: "What issues did you find? I'll create fix tasks."
     options:
       - label: "I'll describe the bugs"
         description: "Let me explain what's broken and where"
       - label: "Tests are failing"
         description: "Some tests are failing after the build"
       - label: "Wrong behavior"
         description: "The feature works but not as expected"
       - label: "Missing functionality"
         description: "Something from the plan wasn't implemented"
   ```

2. **Investigate.** Read the relevant source files, run failing tests, and understand the issues.

3. **Create FIX tasks.** Append a new FIX story to the existing tasks.md with:
   - IDs continuing from the last task (e.g., if T-15 was the last, new tasks start at T-16)
   - Group: `FIX`
   - Agent role based on what needs fixing (backend/frontend)
   - Detail that explains the bug, where it is, and what the fix should be
   - Dependencies on the original story that introduced the bug (declare with `depends_on: [US-NN]`)
   - **`Files:` array** on every task (same rule as STEP 3)
   - **`must_haves` block** on the FIX story (mandatory — see below)
   - **`bug_introducing_story`** field on the FIX story for diff capture (see STEP 6.4)

   **FIX stories require `must_haves` — no exceptions.** A FIX without a goal-backward contract has no verification surface. At minimum:
   - One `truths` entry: "[bug from user description] is no longer reproducible." Phrase as observable behavior, not "the bug is fixed."
   - One `key_links` entry: the code path the fix touches (from-symbol → to-symbol → via).

   If the user-provided bug description is too vague to derive a truth (e.g., "it's broken"), STOP and ask one clarifying question. Do not create a FIX story without a truth.

   ```markdown
   ## FIX-01: Fix issues from review
   _Priority: P0 | Services: api, dispatch-ui | Status: todo | Depends on: US-03_

   bug_introducing_story: US-03

   must_haves:
     truths:
       - "Carrier status from API matches the frontend enum (uppercase ACTIVE/INACTIVE round-trips correctly through fetch + render)"
     artifacts:
       - path: hussle-app-dispatch-ui/src/features/carrier/types.ts
         provides: "CarrierStatus enum aligned with API response casing"
     key_links:
       - from: CarrierListPage
         to: CarrierStatus enum
         via: "consumes API response, displays via enum-mapped label"

   **Tasks:**
   [ ] T-16 [FIX] Fix carrier status enum mismatch
            └─ Detail: CarrierStatus enum in src/features/carrier/types.ts uses ACTIVE/INACTIVE
               but the API returns "active"/"inactive" (lowercase). Update the enum
               to match the API response, or add a transform in the API client.
               Reference: types.ts CarrierStatus enum, contract.yaml GET /carriers response.
            └─ Files: [hussle-app-dispatch-ui/src/features/carrier/types.ts]
            └─ Agent: frontend
            └─ Depends on: —
            └─ Output:
   ```

4. **Capture the bug-introducing diff (CRITICAL — saves agent re-discovery).**

   For each FIX story, before dispatch, capture the `git diff` of the commits the bug-introducing story produced. The orchestrator runs:

   ```bash
   # Find commits associated with the bug-introducing story (US-XX appears in commit messages)
   git log --all --format="%H" --grep="US-XX" > /tmp/fix-{name}-commits.txt
   FIRST_SHA=$(tail -1 /tmp/fix-{name}-commits.txt)
   LAST_SHA=$(head -1 /tmp/fix-{name}-commits.txt)
   git diff "${FIRST_SHA}^..${LAST_SHA}" -- $(echo "$FILES_TOUCHED_BY_STORY") > /tmp/fix-{name}-diff.txt 2>&1
   ```

   Inline the diff as a `## Bug-Introducing Diff` section in the FIX subagent dispatch prompt, scoped to ONLY the files the bug-introducing story touched. The FIX agent reads the actual prior code, not a description. This saves ~10-20k tokens per fix cycle that would otherwise be spent on grep+read re-discovery.

   If the bug-introducing story's commits cannot be located (e.g., commit message doesn't reference US-XX), fall back to `git diff main...HEAD -- <files>` — better than nothing, but tag the FIX prompt with `diff_scope: imprecise — verify via grep before editing`.

4. **Update the summary table** with the FIX story.

5. **Execute FIX story** using the same story flow (STEP 4). Include only the Completed Tasks Summary entries relevant to the tasks being fixed (dependency-scoped, not the full history).

6. **After FIX story completes**, run full validation on affected packages and report:
   ```
   ── Fix loop complete ──────────────────────────
   Fixed: 3 | Still blocked: 0 | Validation: PASS

   Next: /feature-done {name} — Generate PR summary
         or describe more issues for another fix round
   ```

The fix loop can repeat — if fixes introduce new issues, the user describes them and another FIX round is created. Each round appends to the same tasks.md file.

---

## Output Management

Every bash command that could produce more than 5 lines of output MUST redirect to a file under `/tmp/`. Read only compact summaries on failure. Never dump raw command output into the conversation context.

```bash
# CORRECT
npm test --prefix packages/api > /tmp/build-group-api-test.log 2>&1
echo "Exit code: $?"

# WRONG
npm test --prefix packages/api
```

---

## Orchestrator Rules

1. **One agent per story, not per task.** Each story is dispatched as a SINGLE subagent call containing all tasks as a checklist. Never spawn one agent per task — that wastes ~25-30k tokens of duplicated context per dispatch.

2. **Trivial stories execute directly.** Stories tagged `trivial` are executed by the orchestrator using Edit/Write/Bash tools. No subagent overhead. Use this for: enum additions, event map entries, npm installs, Prisma migrations, single-file type definitions.

3. **Task file is source of truth.** Always read the task file before acting. Always write the task file after acting. Never hold task state only in memory.

4. **No silent story transitions.** Never start a new story without printing the story report and getting user confirmation.

5. **One clarifying question max.** If the plan is ambiguous, ask one question. Do not ask multiple rounds of questions.

6. **Timestamp discipline.** The `_Last updated_` line must be refreshed every time the task file is written.

7. **Summary table accuracy.** The summary table must reflect live counts at all times. Recalculate after every story update. Include AC completion counts per story.

8. **Scope subagent context aggressively.** Each subagent gets: all task details for its story, agent template, ONLY the registry for the package it modifies, ONLY contract/types excerpts relevant to this story's endpoints, and ONLY the Completed Tasks Summary entries from stories this story depends on. Never pass the full plan, unrelated registries, or summaries from unrelated stories.

9. **Completed Tasks Summary is dependency-scoped.** After each story completes, append its task summaries to the running summary. When assembling context for a subsequent story, include ONLY summaries from stories in the dependency chain — not all prior stories. If a story has zero cross-story dependencies, omit the Prior Context section entirely.

10. **Failure stops propagation.** If a task fails, downstream stories that depend on it are marked blocked. Do not attempt blocked stories.

11. **Resumability.** The task file must always be in a consistent state so that `/build {name}` can resume from where it left off.

12. **Integration gap detection.** After each story completes, check its reports for "NOT YET WIRED" or "Issues" entries. If no existing WIRE task covers the gap, auto-create one in the appropriate INT story.

13. **Next steps guidance.** When all stories complete or user stops, always print next steps:
    - All done ��� `Next: /feature-done {name} — Generate PR summary`
    - Blocked tasks exist → `Next: Fix blocked tasks, then /build {name} to resume`
    - User stopped → `Next: /build {name} to resume from story {next-story}`
