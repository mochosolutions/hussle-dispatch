# Conventions

Operational conventions for agents and orchestrators. These rules prevent common context-window bloat, path errors, and git hygiene issues.

---

## Output Management

Every bash command that could produce more than 5 lines of output MUST redirect to `/tmp`. This prevents dumping verbose output into the context window.

```bash
# CORRECT
npx vitest --run > /tmp/test-output.txt 2>&1
echo "Tests: $(grep -c 'pass\|fail' /tmp/test-output.txt) results"

# WRONG — dumps into context
npx vitest --run
```

Never call TaskOutput to read an agent's execution trace. It returns the full trace (every tool call, every file read) as raw JSON. Instead, check results on disk: read the tasks.md file for status, check if output files exist with `ls`.

---

## Path Resolution

All `.planning/` paths are relative to the repository root. Before running any workflow command:

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"
```

---

## Commit Format

```
feat(<module>): <task-id> <description>
fix(<module>): <task-id> <description>
refactor(<module>): <description>
test(<module>): <description>
```

---

## Per-Task Validation

Subagents must validate using related tests only, never the full suite:

```bash
# Vitest
npx vitest --related src/changed-file.ts --run > /tmp/test.txt 2>&1

# Jest
npx jest --findRelatedTests src/changed-file.ts > /tmp/test.txt 2>&1
```

Read the test command from the package's CLAUDE.md or `packages.json` — do not guess.

---

## File Staging

Never use `git add .` or `git add -A`. Always stage specific files by name.

```bash
# CORRECT
git add src/shifts/shiftService.ts src/shifts/__tests__/shiftService.test.ts

# WRONG
git add .
git add -A
```
