# Design Decisions: Place Management

## Screen: Place List Page

- Route: `/places`
- Layout: Standard list page — PageHeader + inline filter bar + MainCard with NewDataGrid
- PageHeader: title "Places", subtitle with total count (e.g. "142 places"), "Create Place" primary button right-aligned
- Filter bar: Always visible, horizontal row between PageHeader and MainCard
  - Facility Type dropdown (16 options)
  - State dropdown (US states)
  - Contact dropdown (associated contacts)
  - Search input (searches name, city, state) with 300ms debounce
- DataGrid columns:
  - Name: place name, primary text weight. Sortable.
  - Location: `{city}, {state}` combined. Sortable (by city).
  - Facility Type: plain text, no chip/badge. Sortable.
  - Contact: associated contact name. Not sortable.
  - Hours: hours of operation text. Not sortable.
  - Appt Required: small icon (checkmark when true, dash when false). Not sortable.
  - Actions: ActionsCell with View / Edit / Delete.
- Row click: navigate to `/places/:id` (detail page)
- Pagination: 25 per page, offset-based
- Default sort: name ascending
- Empty state: EmptyState component — "No places yet" + Create Place CTA button
- Filtered-empty state: EmptyState variant — "No places match your filters" + Clear Filters CTA
- Loading state: ListSkeleton
- Mobile (<768px): DataGrid switches to card layout — each row becomes a card showing name, city/state, facility type, appointment badge

## Screen: Place Detail Page

- Route: `/places/:id`
- Layout: Stacked MainCards (3 sections, vertical scroll)
- PageHeader: title = place name (e.g. "Amazon FTW1"), subtitle = "Fort Worth, TX", back button → `/places`, header actions = Edit button (secondary) + Delete button (tertiary/text, neutral styling)
- Delete confirmation: ConfirmDeleteDialog with place name

### Card 1: Location & Facility

- Two-column layout inside MainCard (Grid: left 50%, right 50%, stacks on mobile)
- Left column — Location:
  - Full address (address line 1, line 2)
  - City, State ZIP
  - Lat/Lng with small badge: "Auto" (green, from Redis) or "Manual" (blue, user override)
- Right column — Facility Details:
  - Facility type (label + value)
  - Dock type (label + value)
  - Hours of operation
  - Boolean flags: horizontal icon row with labels (amenity-style display)
    - Appointment Required (calendar icon)
    - Lumper Required (dolly/hand-truck icon)
    - PPE Required (hard-hat icon)
    - Scale On-site (scale icon)
    - Each shows icon + label, enabled = primary color, disabled = grey with strikethrough or muted
- Visible data fields: name, addressLine1, addressLine2, city, state, zip, latitude, longitude, geoSource, facilityType, dockType, hoursOfOperation, appointmentRequired, lumperRequired, ppeRequired, scaleOnSite

### Card 2: Contact & Intelligence

- Single-column layout inside MainCard titled "Contact & Intelligence"
- Associated Contact: name as clickable link (future: navigates to contact detail page in fleet-management). If none, show "No associated contact" muted.
- On-site Contact: name + phone number
- Check-in Procedures: text block (pre-formatted, respects line breaks)
- Notes: text block (pre-formatted)
- Visible data fields: contactId, contactName, onSiteContactName, onSiteContactPhone, checkInProcedures, notes

### Card 3: Recent Loads at This Facility

- MainCard titled "Recent Loads"
- Mini DataGrid (compact, no filters):
  - Load # (link to load detail)
  - Status (color-coded badge per kanban group colors from preamble)
  - Type: Pickup or Delivery (which stop type references this place)
  - Date
  - Carrier name
- Shows last 10 loads referencing this place as a stop
- "View all loads at this facility →" text link below grid (navigates to load list filtered by placeId)
- If no loads: small EmptyState "No loads have used this facility yet"

### Loading & Error States

- PageWrapper handles loading (full page skeleton) and error (retry)
- Loading: FormSkeleton for card sections
- 404: "Place not found" error state with back button

## Screen: Place Create/Edit Form

- Route: `/places/new` (create), `/places/:id/edit` (edit)
- Layout: Full page form, single MainCard
- PageHeader: title "Create Place" or "Edit {placeName}", back button, header actions = Cancel (tertiary text button) + Save (primary button)
- Form max-width: ~600px (per design principles)
- Sections separated by bold Typography heading + 32-48px vertical gap (no accordions, no separate cards)
- Dirty form warning: useDirtyFormBlocker on navigation away

### Section 1: Location

- Name: text input, required
- Address Line 1: text input, required
- Address Line 2: text input, optional (marked as optional)
- City / State / ZIP: single row, 3 columns (city flex, state select ~120px, zip ~100px)
- State: Select dropdown with US states
- Lat/Lng: NOT shown on form. Auto-populated server-side on save. Visible only on detail page.

### Section 2: Facility Details

- Facility Type: select dropdown, required. 16 options: Distribution Center, Warehouse, Manufacturing Plant, Cold Storage, Cross-Dock, Intermodal Yard, Port/Terminal, Rail Yard, Retail Store, Grocery/Food Service, Construction Site, Farm/Agricultural, Military/Government, Residential, Airport, Other
- Dock Type: select dropdown, optional. Options: Dock High, Ground Level, Both, None
- Hours of Operation: text input, optional. Placeholder: "e.g. M-F 7:00 AM - 5:00 PM"
- Appointment Required: MUI Switch toggle, default off
- Lumper Required: MUI Switch toggle, default off
- PPE Required: MUI Switch toggle, default off
- Scale On-site: MUI Switch toggle, default off
- Toggles arranged in 2x2 grid on desktop, stacked on mobile

### Section 3: Contact & Intelligence

- Associated Contact: searchable select dropdown (fetches from contacts API). Optional. Shows "Search contacts..." placeholder.
- On-site Contact Name: text input, optional
- On-site Contact Phone: text input, optional. Placeholder: "(555) 555-5555"
- Check-in Procedures: textarea, 3 rows, optional. Placeholder: "Describe check-in process, gate codes, etc."
- Notes: textarea, 3 rows, optional

### Form Behavior

- Validation: Yup schema, inline validation on blur, cross-field on submit
- Required fields: name, addressLine1, city, state, zip, facilityType
- On save (create): POST → redirect to `/places/:id` detail page with success snackbar
- On save (edit): PATCH → redirect to `/places/:id` detail page with success snackbar
- On cancel: navigate back (list or detail, depending on entry point) with dirty form warning if unsaved
- Save button: disabled briefly during submission with spinner (LoadingButton)
- Error handling: field-level errors inline, server errors as snackbar toast

## Component: PlaceTypeahead

- Reusable component, NOT a standalone page
- Used in: load-management stop forms (FACILITY field in load creation)
- Component: MUI Autocomplete with async options loading
- API: `GET /api/v1/places/typeahead?q={query}&limit=10`
- Trigger: min 2 characters, 300ms debounce
- Dropdown option format (two-line):
  - Line 1: **Place Name** (bold/primary weight)
  - Line 2: City, State · Facility Type · Contact Name (secondary text, muted)
- On selection: parent form auto-fills address, city, state, zip, contact fields. All auto-filled fields remain editable.
- End adornment: "+" icon button to open quick-create drawer
- Excludes soft-deleted places (server-side filter)
- Loading state: circular progress in input end adornment while fetching
- No results state: "No places found" option text + "Create new place" action in dropdown footer

### Quick-Create Drawer

- Pattern: Slide-over drawer from right side
- Trigger: "+" button on PlaceTypeahead, or "Create new place" in no-results dropdown
- Minimal fields only (not the full create form):
  - Name (required)
  - Address Line 1 (required)
  - City (required)
  - State (required, select)
  - ZIP (required)
  - Facility Type (required, select)
- On save: creates place via API, auto-selects it in the typeahead, closes drawer
- On cancel: closes drawer, returns focus to typeahead input
- Width: ~400px on desktop, full-width on mobile

### Facility Info Badge

- When a place with special requirements is selected (appointment, lumper, PPE), show a small info row below the typeahead:
  - "⚠ Appointment Required · Lumper Required" (amber text, relevant flags only)
- This warns dispatchers about facility requirements when assigning stops

## Responsive Summary

| Breakpoint | Behavior |
|-----------|----------|
| >1200px | Full layout, two-column detail cards, inline filters, standard DataGrid |
| 768-1200px | Reduce filter bar to 2 per row, detail cards stack to single column |
| <768px | List: card layout instead of DataGrid. Forms: single column. Drawer: full-width. Filters: collapsible |
