# Automated Development Workflow

Automated development workflow for Claude Code. Plan features conversationally, break them into grouped tasks, execute group-by-group with subagents, pause between groups for review.

## Workflow Flow

```
/bootstrap → /feature-init → /prd-refine → /design (optional) → /contract-freeze (optional) → /build → /feature-done
Quick path: /improve
Utilities: /screenshots, /status
Reference: /testing-conventions, /design-principles, /conventions
```

## Directory Layout

```
.planning/
├── codebase/
│   └── packages.json            # Package paths, types, validation commands
├── screenshots/                 # App screenshots from /screenshots
│   ├── INVENTORY.md             # Route → filename mapping
│   └── *.png
└── {feature-name}/              # One directory per feature
    ├── plan.md                  # Requirements from /prd-refine
    ├── tasks.md                 # Task orchestrator — single source of truth
    ├── contract.yaml            # Frozen API contract (optional)
    └── designs/                 # UI screen specs (optional)
        └── {screen}.md
```

## Task File Format

Tasks are tracked in `.planning/{name}/tasks.md`. Each task has a status marker:

```
[ ] T-01 [SETUP] Short description          # todo
[~] T-02 [API]   In progress task           # in-progress
[x] T-03 [API]   Completed task             # done
[!] T-04 [WIRE]  Blocked task               # blocked
```

Status transitions: `[ ] todo` → `[~] in-progress` → `[x] done`. Tasks with unmet dependencies are marked `[!] blocked`.

## Validation Strategy

Three tiers — only per-task runs automatically:

1. **Per-task** — Subagents run related tests only (`vitest --related`, `jest --findRelatedTests`) after each task. Fast, catches regressions.
2. **Per-group** — After a group completes, run affected package's test + typecheck before pausing for review.
3. **Full suite** — Only on explicit request or as a final optional task group.

## Agent Templates

Subagents are dispatched via Claude Code's Task tool. The orchestrator selects the appropriate prompt template based on task type:

| Agent | Role |
|-------|------|
| **backend-coder** | API, DB, service tasks. Writes services, routes, validations, tests. |
| **frontend-coder** | UI, component, page tasks. Writes components, hooks, pages, tests. |
| **code-reviewer** | Read-only review of all diffs. Reports issues. |
| **debugger** | Read-only diagnostic agent. Produces debug reports. |

## Skills

| Skill | Description |
|-------|-------------|
| `/bootstrap` | Scan project, generate packages.json and update CLAUDE.md |
| `/feature-init` | Create `.planning/{name}/` directory and git branch |
| `/prd-refine` | Conversational requirements refinement → plan.md |
| `/design` | UI design conversation with screenshot reference → screen specs |
| `/contract-freeze` | Generate and freeze OpenAPI contract |
| `/build` | Task orchestrator: plan → tasks → group-by-group execution |
| `/feature-done` | Generate PR summary from completed tasks |
| `/improve` | Lightweight path for small changes (express mode for ≤3 files) |
| `/status` | Show task progress across features |
| `/screenshots` | Capture app screenshots with Playwright |
| `/conventions` | Output management, path resolution, commit format |
| `/testing-conventions` | Test patterns, naming, and quality standards |
| `/design-principles` | UI/UX design rules |

## Git Conventions

| Branch | Purpose |
|--------|---------|
| `feature/{name}` | Feature development |
| `improve/{slug}` | Improvements and bug fixes |

Commit format: `feat(<module>): <task-id> <description>`

## Resuming Work

Re-run `/build {name}`. It detects the existing `.planning/{name}/tasks.md` and resumes from the first incomplete group.

## Troubleshooting

- **"packages.json not found"** — Run `/bootstrap` first.
- **Task marked blocked** — Read the Output field, resolve it, re-run `/build`.
- **Build crashed mid-feature** — Re-run `/build`. It skips completed tasks.
- **Context feels degraded** — Start a new session.
