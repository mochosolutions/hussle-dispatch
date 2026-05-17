# /feature-done

Generate a PR summary from completed work on a feature branch.

## Usage

```
/feature-done <feature-name> [--force] [--skip-verify]
```

Example: `/feature-done shift-scheduling`

**Flags:**
- `--force` — override the verification gate when verification.md has BLOCKER findings. Use ONLY with explicit acknowledgment that you're shipping unverified code. The PR summary will list the BLOCKERs for transparency.
- `--skip-verify` — proceed without verification.md (legacy features built before must_haves were introduced). The PR summary will be tagged "(unverified)".

## Procedure

### Step 1: Gather Inputs

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

FEATURE_NAME="<feature-name>"
FEATURE_DIR=".planning/$FEATURE_NAME"
TASKS_FILE="$FEATURE_DIR/tasks.md"

if [ ! -f "$TASKS_FILE" ]; then
  echo "ERROR: $TASKS_FILE not found."
  exit 1
fi
```

### Step 2: Parse Tasks

Read `$TASKS_FILE` and categorize entries:

- **Completed** — lines matching `- [x]`
- **Blocked** — lines matching `- [~]` or `- [-]` or containing "blocked" (capture the reason)
- **Remaining** — lines matching `- [ ]`

### Step 3: Get Git Diff

```bash
DIFF_STAT=$(git diff main...HEAD --stat)
DIFF_FULL=$(git diff main...HEAD)
```

Use `--stat` for the file list summary. Read the full diff to understand what changed.

### Step 3.5: Verification Gate (MANDATORY before generating the PR summary)

Read `.planning/<feature-name>/verification.md` if present.

**If verification.md exists:** parse the report headers:
- `## VERIFIED` → count entries
- `## FAILED (BLOCKER)` → count entries
- `## UNCERTAIN (WARNING)` → count entries

**Refusal logic:**

```
If FAILED (BLOCKER) count > 0 AND --force was NOT passed:
  Print: "❌ /feature-done refused: <N> BLOCKER finding(s) in verification.md."
  Print: Each BLOCKER entry with its file:line citation.
  Print: "Next:
            1. Address the BLOCKERs (via /build <name> FIX tasks or direct edit)
            2. Re-run /feature-verify <name>
            3. Re-run /feature-done <name> once verification passes
          Override: /feature-done <name> --force (use ONLY with explicit acknowledgment of the BLOCKERs)."
  STOP. Do not generate the PR summary.

If FAILED (BLOCKER) count > 0 AND --force was passed:
  Print: "⚠ Generating PR summary with <N> BLOCKER(s) overridden via --force."
  Print: BLOCKER list for transparency in the PR description.
  Continue to Step 4.

If FAILED == 0 (UNCERTAIN may be > 0):
  Continue to Step 4.
```

**If verification.md does NOT exist:**

```
Print: "⚠ No verification.md found at .planning/<feature-name>/.
        Run /feature-verify <name> first to confirm the implementation matches must_haves.
        To proceed without verification: /feature-done <name> --skip-verify"
STOP unless --skip-verify is passed.
```

`--skip-verify` is for the legacy-feature case (features built before must_haves were introduced). New features should never need it.

### Step 4: Generate PR Summary

Analyze the completed tasks, blocked items, diff, and verification.md to produce a summary. Print it directly to the screen in this format:

```markdown
## Summary

<2-4 sentences describing what this feature does and why it matters.>

## Verification Status

<Generated from verification.md:>
- ✓ VERIFIED: <count> must_have(s) confirmed via grep + read.
- ? UNCERTAIN: <count> need(s) manual confirmation (list them).
- ✗ FAILED (BLOCKER): <count> (only present if --force was used; lists each).

<Omit this section entirely if --skip-verify was used. Note "(unverified)" instead.>

## What Was Built

<Bulleted list derived from completed tasks. Group by area if logical.>

## Blocked / Deferred

<Bulleted list of blocked tasks with reasons. Omit this section if nothing is blocked.>

## Key Decisions

<Bulleted list of notable implementation choices discovered from the diff
or recorded in .planning/<feature-name>/. Omit if none are notable.>

## Files Changed

<Paste the git diff --stat output here.>
```

### Step 5: Report

After printing the summary:

```
---
PR summary printed above. Copy into your PR description.
  Branch: feature/<feature-name>
  Tasks:  <completed> done, <blocked> blocked, <remaining> remaining
```

## Notes

- This skill only reads and reports. It does not commit, push, or modify any files.
- The summary is printed to stdout so the user can copy-paste it into a PR description.
- If no tasks are blocked, omit the "Blocked / Deferred" section entirely.
- If `.planning/<feature-name>/` contains other files (notes, decisions, etc.), use them to enrich the "Key Decisions" section.

## Next Steps

After printing the PR summary:

```
Next steps:
  1. Review the summary above and copy into your PR description
  2. git push origin feature/<feature-name>
  3. Create PR via gh pr create or GitHub UI
```
