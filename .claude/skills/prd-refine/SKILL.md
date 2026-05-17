# /prd-refine

Conversational command that guides you through defining requirements, then writes a plan document.

## Usage

```
/prd-refine <name>
```

This runs in YOUR context — it's a conversation, not an agent dispatch.

## What This Does

1. Loads project context (packages, existing code, CLAUDE.md)
2. Asks targeted questions to understand the feature
3. You answer, we iterate until requirements are solid
4. Writes a plan document that /build will consume

## Procedure

### Phase 0: Ensure Repository Root

All `.planning/` paths are relative to the repository root. Verify before proceeding:

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"
```

### Phase 1: Context Loading

Load silently (don't dump all of this to the user):

```
- .planning/codebase/packages.json (package paths, types, validation commands)
- CLAUDE.md at project root (coding conventions)
- .planning/screenshots/ (if present — current app visuals)
```

Read per-package source code as needed during the conversation (use Glob/Grep/Read to explore the codebase for existing patterns, utilities, and models relevant to the feature).

If `.planning/screenshots/` contains images, read them to understand the current app state. Reference them during the conversation:
> "Looking at the current dashboard screenshot, I can see the sidebar navigation and data table layout. Should the new feature follow this same page structure?"

### Phase 2: Guided Requirements Conversation

**Use the AskUserQuestion tool for all questions.** This gives the user structured options and makes the conversation interactive. Every question should have thoughtful options based on what you've learned from context loading, codebase scanning, and screenshots.

#### Questioning Philosophy

How you question determines the plan quality. Follow these principles:

- **Start open** — Let them dump their mental model first. Use AskUserQuestion with an open "Let me explain" option so they can describe freely.
- **Follow energy** — Whatever they emphasize or get excited about, dig deeper there with follow-up questions. That's where the real requirements hide.
- **Challenge vagueness** — "Simple" means what exactly? "Users" means which users? "Fast" means what response time? Push abstract language into concrete specifics. Offer specific interpretations as options.
- **Make the abstract concrete** — When they describe a concept, ask them to walk through the user flow. Offer flow variations as options.
- **Know when to stop** — When you can write a clear plan with testable acceptance criteria, offer to proceed. Don't over-question.

#### Automatic Codebase Scanning

During the conversation, actively read source files and registries to understand what exists. Surface findings in your questions and option descriptions:

Example — instead of a generic question, use what you found in the registry:
```
AskUserQuestion:
  question: "Your codebase has a useDataGrid hook with pagination and sorting built in.
             Should the carrier list use this, or does it need a custom approach?"
  options:
    - label: "Use useDataGrid"
      description: "Reuse the existing hook — it already handles pagination, sorting, and loading states"
    - label: "Custom approach"
      description: "This list has unique requirements that don't fit the standard pattern"
    - label: "Let me explain"
      description: "I have specific requirements for the list behavior"
```

This ensures every question is grounded in what actually exists.

#### Screenshot Integration

If `.planning/screenshots/` was loaded in Phase 1, reference the visuals in your questions:

```
AskUserQuestion:
  question: "Looking at the current dashboard, I can see the sidebar navigation and data table layout.
             Should the new feature follow this same page structure?"
  options:
    - label: "Same layout"
      description: "Use the standard PageWrapper + sidebar nav pattern from existing pages"
    - label: "Different layout"
      description: "This feature needs a different page structure"
    - label: "Show me the screenshot"
      description: "I want to review the current UI before deciding"
```

#### Gated Web Search

When you identify genuine technical unknowns, ask before searching:

```
AskUserQuestion:
  question: "I'm not sure about the best approach for timezone handling in Node.
             Should I research libraries before we finalize the plan?"
  options:
    - label: "Yes, research it"
      description: "Search for timezone libraries and recommend the best approach"
    - label: "I already know"
      description: "I have a preference — let me tell you"
    - label: "Skip for now"
      description: "We'll figure it out during implementation"
```

If approved, work findings into the conversation and the plan's Technical Context section.

**Provenance discipline (mandatory when web search is used):**

Tag every fact captured from research with one of:

- `[VERIFIED: <tool/source>]` — confirmed this session via Bash, grep, npm view, or direct tool output. Highest confidence.
- `[CITED: <url>]` — sourced from a fetched URL or official doc. Reader can re-verify.
- `[ASSUMED]` — based on training data, not verified this session. Treat as hypothesis.

Training data is months-stale by default — never present a training-derived claim as `[VERIFIED]`. When in doubt, tag `[ASSUMED]` and surface in the Assumptions Log (see Phase 3).

#### Conversation Flow

Work through requirements using AskUserQuestion at each step. Ask 1-2 questions per turn — don't bombard with 4 questions at once. Between questions, scan the codebase for relevant context to inform the next question.

**Step 1 — Scope (open-ended):**
```
AskUserQuestion:
  question: "What does this feature need to do? What's the core problem it solves?"
  options:
    - label: "Let me explain"
      description: "I'll describe the feature and what problem it addresses"
    - label: "I have a doc/PRD"
      description: "I have an existing document with requirements I can share"
    - label: "It's similar to..."
      description: "It's like an existing feature in this app or another product"
```

**Step 2 — Boundaries:**
After they describe the feature, ask what it should NOT do. Offer specific exclusions based on what you heard:
```
AskUserQuestion:
  question: "Based on what you described, should this feature also handle [related capability]?
             Or is that separate?"
  options:
    - label: "Include it"
      description: "[related capability] should be part of this feature"
    - label: "Separate feature"
      description: "That's a different feature — exclude it from this plan"
    - label: "Defer to v2"
      description: "Nice to have but not for the first version"
```

**Step 3 — Capabilities & Priority:**
Present what you understood as capabilities and let them prioritize:
```
AskUserQuestion:
  question: "Here's what I'm hearing as the core capabilities. Which are must-have vs nice-to-have?"
  multiSelect: true
  options:
    - label: "[Capability 1] — P0"
      description: "Must have for first version"
    - label: "[Capability 2] — P0"
      description: "Must have for first version"
    - label: "[Capability 3] — P1"
      description: "Nice to have, can defer"
```

**Step 4 — Data & User Flows:**
Ask about the main user flow with specific path options:
```
AskUserQuestion:
  question: "Walk me through the main flow. The user opens the page and...?"
  options:
    - label: "Let me walk through it"
      description: "I'll describe the step-by-step user flow"
    - label: "Similar to [existing page]"
      description: "Follow the same pattern as [page from registry] with these differences..."
```

**Step 5 — Error Handling & Edge Cases:**
Ask about specific error scenarios relevant to what they described:
```
AskUserQuestion:
  question: "What happens when [specific error scenario]?"
  options:
    - label: "Show error message"
      description: "Display an error state and let the user retry"
    - label: "Fail silently"
      description: "Log the error but don't interrupt the user"
    - label: "Custom handling"
      description: "I have specific requirements for this scenario"
```

**Step 6 — Affected Services:**
Based on packages.json, confirm which services are touched:
```
AskUserQuestion:
  question: "Based on the codebase, this will touch [api-package] and [admin-ui-package]. Anything else?"
  options:
    - label: "Just those"
      description: "Only the packages you identified"
    - label: "Also [shared-package]"
      description: "We'll need changes in the shared library too"
    - label: "Let me specify"
      description: "I know exactly which packages are affected"
```

**Step 7 — Ready to write:**
When you have enough to write the plan, confirm:
```
AskUserQuestion:
  question: "I have enough to write the plan. Ready, or do you want to cover anything else?"
  options:
    - label: "Write the plan"
      description: "I'm satisfied — generate plan.md"
    - label: "One more thing"
      description: "I have additional requirements to discuss"
    - label: "Let me review first"
      description: "Summarize what you have before writing"
```

### Phase 2.5: Analog Discovery

Before writing the plan, identify the closest in-tree analog for every new or modified file. This produces `PATTERNS.md` — a per-file lookup table the `/build` subagents use to mirror existing code instead of inventing from scratch.

**Procedure:**

1. **Infer the file list** from the conversation. List each new file and each existing file that will be touched (paths, not patterns).

2. **Spawn ONE Explore subagent** with a focused brief:

   > "For each of the following files, find the closest existing analog in the codebase. Match on role (controller, component, service, model, middleware, hook, slice, page, test) AND data flow (CRUD, request-response, pub-sub, file-I/O, render, transform). Return ONE markdown table with columns: New / Modified File | New? | Role | Closest Analog | Match. Cite analogs as `path/to/file.ts:start-end` line ranges. Match values: exact / role-match / partial / n/a (in-place edit). Read-only — do not modify anything."

3. **Capture the table.** The subagent returns one markdown table. If it produced prose, extract only the table.

4. **Write `.planning/<name>/PATTERNS.md`** in Phase 3 (alongside `plan.md`) — see template below.

**PATTERNS.md format:**

```markdown
# <Feature Name> — Pattern Map

> Generated by /prd-refine on <ISO date>
> Use as the "what to copy from" reference during /build.

| New / Modified File | New? | Role | Closest Analog | Match |
|---|---|---|---|---|
| `src/features/X/Y.tsx` | NEW | component | `src/features/Z/W.tsx:14-62` | exact |
| `src/api/X.ts` | MODIFY | service | self — extend existing at L28-41 | exact |
| `src/X.test.ts` | NEW | unit-test | `src/Y.test.ts:1-40` | partial |
```

**Rules:**
- Every new file MUST have an analog (use `partial` match if nothing closer exists, never blank).
- Modified files cite themselves: `self — extend existing at L<start>-<end>`.
- Tests get matched against existing tests in the same package, not against the file under test.

**Guardrails:**
- If the file list exceeds 25 entries, ask the user to split the feature.
- If no analog can be found for a new file (truly novel pattern), flag it explicitly: `match=partial` + note in the table. Do not fabricate an analog.

### Phase 3: Write the Plan

After the conversation, create `.planning/<name>/plan.md`. This document must be structured enough for the task orchestrator to break into atomic tasks.

```markdown
# <Feature Name>

> Generated by /prd-refine on <ISO date>

## Problem
<!-- What problem does this solve? Who has it? -->

## Solution Overview
<!-- High-level description of what we're building -->

## Capabilities
### Must Have (P0)
- <specific, testable capability>

### Nice to Have (P1)
- <specific capability, deferrable>

## User Flows
### <Flow Name>
1. User does X
2. System responds with Y
3. ...

## Data Requirements
<!-- New or modified models, fields, relationships -->
- <Model>: <fields and types>

## API/Interface Changes
<!-- New endpoints, modified contracts, new components -->
- `POST /api/resource` — creates resource, returns 201
- `<ComponentName>` — new page/component at route /path

## Affected Services
<!-- Which packages from packages.json are touched -->
| Service | Changes |
|---------|---------|
| <serviceKey> | <what changes> |

## Technical Context

### Existing Code to Reuse
- [Component/utility] ([package]) — [what it does, how this feature uses it]

### Key Decisions
- [Decision] — [reasoning]
- [Explicit exclusion] — [why not now]

### Research Findings
<!-- Only present if web search was used. Tag every claim: [VERIFIED: source] / [CITED: url] / [ASSUMED] -->
- [Library/approach] — [recommendation] [VERIFIED: npm view <pkg>]

### Research Provenance
<!-- Only present if web search was used. Lists sources behind Research Findings. -->
- **HIGH (verified):** [tool/source — what was confirmed]
- **MEDIUM (cited):** [url — what was sourced]
- **LOW (assumed):** [training-data claim — needs confirmation, see Assumptions Log]

### Assumptions Log
<!-- Only present if any claim is [ASSUMED]. Empty table = no follow-up needed. -->

| #  | Claim                                       | Section | Risk if wrong            |
|----|---------------------------------------------|---------|--------------------------|
| A1 | [assumed claim]                             | [where] | [impact if wrong]        |

## Acceptance Criteria
<!-- Testable criteria pulled from the conversation -->
- <specific, measurable criterion>

## Out of Scope
- <explicitly excluded items>
```

Present a summary:
> "Here's the plan. Any gaps before I write it?"

After approval, write **both** files:
- `.planning/<name>/plan.md` — the plan
- `.planning/<name>/PATTERNS.md` — the analog table from Phase 2.5

Confirm:

```
Plan written:     .planning/<name>/plan.md
Patterns written: .planning/<name>/PATTERNS.md  (<N> files mapped)

Next steps:
  /design <name>          — (optional) Design UI screens with screenshot reference
  /contract-freeze <name> — (optional) Generate and freeze API contract
  /build <name>           — Break plan into tasks and start building
```

## Guardrails

- If the user provides vague requirements, ask for specifics — don't write a vague plan
- If the feature scope is enormous, suggest splitting into multiple plans
- Check the codebase for existing code that this feature might reuse or conflict with
- Every acceptance criterion must be testable — no "works well" or "good UX"
- Service keys in the plan must match those in packages.json
