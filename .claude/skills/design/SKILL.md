# /design

Conversational UI design — discuss screens with the user, reference existing app screenshots for consistency, and write structured design specs.

## Usage

```
/design <name>
```

Optional. Skip for backend-only features or minor frontend changes.

## What This Does

1. Load context: plan, screenshots, existing UI patterns
2. Conversational design discussion with the user
3. Write design specs to `.planning/<name>/designs/`
4. User reviews and approves

## Procedure

### Step 1: Load Context

Read silently:

```
- .planning/<name>/plan.md (capabilities and user flows)
- Existing UI source code (grep for pages, components, patterns)
- .planning/screenshots/ (existing app screenshots for visual consistency)
- .claude/skills/design-principles/SKILL.md (design rules and principles)
```

If `.planning/screenshots/` contains images, read them using the Read tool. These are your reference for the app's current visual style — new designs should match unless the user says otherwise.

### Step 2: Design Conversation

Start with what the user sees:

> "Let's design the UI for [feature]. Based on the plan, you need [summary of screens]. Here's what your current app looks like: [reference loaded screenshots]."

For each screen, discuss:

1. **Purpose:** What is the user trying to accomplish?
2. **Layout:** What goes where? Information hierarchy?
3. **Components:** What existing components to reuse? What's new?
4. **Data display:** Columns, fields, formatting for dates/statuses/numbers
5. **States:** Loading, empty, error
6. **Interactions:** What's clickable? What happens on click?

Ground the conversation in existing patterns and screenshots:

> "Your current pages use [pattern from screenshots]. Should this new screen follow the same style?"

### Step 3: Write Design Specs

After discussing each screen, write a spec file to `.planning/<name>/designs/<screen>.md`.

Each spec should include:

- Screen name and purpose
- Layout description (referencing existing patterns)
- Component choices (reused vs new)
- Data fields and their display format
- Visible Data Fields table (for contract cross-check):

```markdown
## Visible Data Fields

| UI Label     | Expected API Field | Format        |
|--------------|--------------------|---------------|
| Facility     | facilityName       | string        |
| Start Time   | startTime          | datetime      |
| Status       | status             | badge/chip    |
```

- Interaction behaviors
- Loading, empty, and error states
- Responsive behavior (if applicable)

### Step 4: Review

Present a summary of all specs:

> "Design specs written for [N] screens: [list]. Any changes needed?"

Iterate until the user approves.

## Output

Design specs are written to:

```
.planning/<name>/designs/<screen>.md
```

One file per screen. These are referenced during `/build` by the implementation tasks.

## Next Steps

```
Next steps:
  /contract-freeze <name> — (if API work needed) Generate API contract
  /build <name>           — Break plan into tasks and start building
```

## Notes

- Reference the design-principles skill for consistent design rules.
- Screenshots in `.planning/screenshots/` are your visual ground truth for the app's current style.
- The Visible Data Fields table in each spec is used by `/contract-freeze` for cross-checking API coverage.
- If you want to iterate on designs later, re-run `/design` — read existing specs and ask what to change.
