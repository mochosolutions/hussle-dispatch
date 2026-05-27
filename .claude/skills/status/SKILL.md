# /status

Show progress for planned features by reading task files.

## Usage

```
/status              # Show all features
/status {name}       # Show specific feature
```

## All Features View

Scan `.planning/*/tasks.md` files. For each file found, parse the task list and build a summary.

### Parsing tasks.md

Each `tasks.md` contains a summary table and grouped tasks with status markers:

- `[x]` = done
- `[ ]` = remaining
- `[!]` = blocked

Count each status per feature.

### Display Format

```
FEATURES
========

| Feature           | Total | Done | Blocked | Remaining | Current Group     |
|-------------------|-------|------|---------|-----------|-------------------|
| shift-scheduling  | 12    | 8    | 1       | 3         | API Integration   |
| nurse-matching    | 9     | 2    | 0       | 7         | Data Model        |

Overall: 21 tasks, 10 done (48%), 1 blocked, 10 remaining
```

The "Current Group" is the first group heading (`##` or `###`) that contains a task
still marked `[ ]` or `[!]`.

### Procedure

```bash
for tasks_file in .planning/*/tasks.md; do
  FEATURE=$(basename "$(dirname "$tasks_file")")
  # Count [x], [ ], [!] markers
  # Identify first group with incomplete tasks
  # Add row to summary table
done
```

## Specific Feature View

```
/status shift-scheduling
```

Read `.planning/shift-scheduling/tasks.md` and display the full task list with statuses:

```
FEATURE: shift-scheduling
=========================

## Data Model
  [x] Create shift schema and migration
  [x] Add validation rules
  [x] Seed test data

## API Endpoints
  [x] GET /shifts — list with filters
  [x] POST /shifts — create
  [!] PUT /shifts/:id — update (blocked: waiting on validation refactor)
  [ ] DELETE /shifts/:id — soft delete

## Frontend
  [ ] Shift list page
  [ ] Shift create/edit form

Progress: 5/9 done, 1 blocked, 3 remaining
```

If the feature directory or tasks.md does not exist, report it clearly:

> "No tasks found for 'shift-scheduling'. Expected file: .planning/shift-scheduling/tasks.md"

## Next Steps

After showing status, suggest the logical next action based on state:

- **All tasks done, no verification yet** → `Next: /feature-verify {name} — Goal-backward check against must_haves`
- **All tasks done + verification.md exists with VERDICT: SHIP** → `Next: /feature-done {name} — Generate PR summary`
- **Tasks remaining** → `Next: /build {name} — Resume building`
- **Tasks blocked** → `Next: Fix blocked tasks, then /build {name} to resume`
- **No tasks.md exists but plan.md exists** → `Next: /build {name} — Create tasks and start building`
- **Nothing exists** → `Next: /feature-init {name} — Start a new feature`
