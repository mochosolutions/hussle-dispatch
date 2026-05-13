# Interview Shell & Navigation

> Reference mockup: `onboard_questions.png`

## Purpose
The container layout for the entire conversational interview. Houses the question thread, phase navigation, and progress indicator.

## Layout

### Header Bar (fixed top, ~56px)
- Left: "Hussle Dispatch" branding (icon + text, small)
- Center: Phase indicator breadcrumb (current phase name in caps, e.g., "EQUIPMENT")
- Right: Save & Exit link (saves progress, shows "You can come back anytime")
- White background, subtle bottom border (grey-200)

### Content Area
- White background, full viewport height minus header
- Single centered column, max-width ~680px
- Generous top padding (48px from header)
- Question thread grows downward
- Auto-scrolls to bring active question into view after answering

### Progress Bar (fixed bottom)
- Thin bar (~4px) spanning full viewport width
- Blue fill showing overall completion percentage
- Subtle: doesn't compete with content, just provides ambient progress awareness
- Shows "X of Y" or percentage on hover

### Phase Navigation
- Phase label shown in header breadcrumb: COMPANY → EQUIPMENT → DRIVERS → COST ANALYSIS → LANE PREFERENCES → DOCUMENTS
- Phase transitions: when advancing to a new phase, a full-width divider appears in the thread with the new phase name (e.g., "EQUIPMENT" label with a horizontal rule)
- No clickable phase navigation — carrier progresses linearly. They can scroll up and Edit previous answers, which may take them back to earlier phases.

## Question Thread Layout

### Active Question
- Large bold text (20px, font-weight 600, grey-900)
- Hint text below (14px, grey-500, max-width ~600px for readability)
- Input field(s) below hint (type varies by question)
- "Next" or "Continue" button below input (blue, right-aligned)
- Generous vertical spacing: 24px between question text and input, 16px between input and button

### Answered Question (collapsed)
- White card with subtle border (grey-200), 16px padding
- Question label: grey-500, 13px, uppercase tracking
- Answer value: grey-900, 16px, semibold
- "Edit" link: blue text, right-aligned within the card
- Clicking Edit re-expands the question inline (replaces the collapsed card)

### Sub-Questions
- Indented 24px from parent
- Colored left border (4px):
  - Blue (#3B82F6): required compliance info
  - Green (#22C55E): optional info
  - Red (#EF4444): compliance flag requiring attention
  - Grey (#9CA3AF): neutral follow-up
- Sub-question label includes category tag (e.g., "DOT REGISTRATION — REQUIRED" in red, "MC AUTHORITY — OPTIONAL" in green)
- Sub-answers: same collapsed card style but indented, slightly tinted background (blue-50 for blue border items, etc.)

### Phase Dividers
- Full-width horizontal line
- Phase name centered above in uppercase, grey-400, 12px, letter-spacing 1px
- 48px margin above and below

## Interactions
- Answering a question triggers: (1) 500ms debounced auto-save, (2) collapse animation on current answer, (3) fade-in of next question with scroll
- Edit on a collapsed answer: smooth expand, scroll to bring into view
- Changing a parent answer: clears all sub-answers below it, sub-questions re-evaluate visibility
- Save & Exit: saves current progress, shows confirmation toast, redirects to a "Come back anytime" page with the portal link

## States
- **Loading (initial)**: Skeleton cards for 2-3 questions while session loads
- **Resuming**: Scrolls to first unanswered question, all previous answers shown collapsed above
- **Auto-saving**: Subtle "Saving..." indicator near progress bar (fades after save confirms)
- **Save failed**: "Changes not saved — check your connection" warning bar below header, retry on next answer
- **Phase complete**: Brief animation/checkmark before phase divider appears

## Responsive
- Content column: 680px on desktop, full-width with 24px padding on tablet, 16px padding on mobile
- Header: branding left, phase center (hidden on mobile — shown as label above first question instead), Save & Exit right
- Progress bar stays at bottom on all sizes
- Collapsed answer cards stack vertically on all sizes (no layout change needed)
