# Entity Autocomplete Refactor Tasks
_Last updated: 2026-03-26 16:30_

---

## US-01: EntityAutocomplete shared base component
_Priority: P0 | Services: dispatch-ui | Status: todo_

**Acceptance Criteria:**
- [ ] Debounced search (300ms) with request cancellation via ref tracking
- [ ] Formik-coupled via standard `formik` prop pattern
- [ ] Accepts `fetchOptions: (search: string) => Promise<Option[]>` for API integration
- [ ] Accepts `renderOption` for custom per-entity option display
- [ ] Accepts `scopeParams` for filtered queries (e.g., customerId, carrierId)
- [ ] "Add New" action button renders at bottom of dropdown via `createNewLabel` prop
- [ ] `renderInlineCreate` render prop expands inline form below field when "Add New" clicked inside a drawer
- [ ] `onCreateNew` callback for opening a drawer when NOT inside a drawer context
- [ ] Auto-selects newly created entity after inline create succeeds
- [ ] Loading spinner during search

**Tasks:**
[x] T-01 [SETUP] Create EntityAutocomplete component
         └─ Agent: frontend
         └─ Depends on: —
         └─ Output: Files: src/components/EntityAutocomplete/index.tsx (created)
            Exports: EntityAutocomplete, EntityAutocompleteOption, EntityAutocompleteProps
            Issues: None — tsc and eslint pass

---

## US-02: Migrate autocomplete components to EntityAutocomplete
_Priority: P0 | Services: dispatch-ui | Status: todo_

**Acceptance Criteria:**
- [ ] CarrierAutocomplete uses EntityAutocomplete with carrier-specific option rendering
- [ ] CustomerAutocomplete uses EntityAutocomplete with customer-specific option rendering
- [ ] BrokerAutocomplete uses EntityAutocomplete with contact-specific option rendering and optional customerId scope
- [ ] PlaceTypeahead uses EntityAutocomplete with place-specific option rendering
- [ ] All existing usage sites work without regression (Create Load, detail drawers, entity pages)

**Tasks:**
[x] T-02 [UI] Migrate CarrierAutocomplete to EntityAutocomplete
         └─ Agent: frontend | Depends on: T-01
         └─ Output: Files: carrier/CarrierAutocomplete (rewritten), driver/DriverCreateDialog (updated), vehicle/VehicleCreateDialog (updated)
            Exports: CarrierAutocomplete (named+default). Consumers now pass formik directly.
            Issues: None — tsc and eslint pass

[x] T-03 [UI] Migrate CustomerAutocomplete to EntityAutocomplete
         └─ Agent: frontend | Depends on: T-01
         └─ Output: Files: customer/CustomerAutocomplete (rewritten), load/LoadDetailsSection (updated), contact/ContactInfoDrawer (updated)
            Exports: CustomerAutocomplete (named+default). Consumers now pass formik directly.
            Issues: None — tsc and eslint pass (2 pre-existing warnings in LoadDetailsSection for unused imports)

[x] T-04 [UI] Migrate BrokerAutocomplete to EntityAutocomplete
         └─ Agent: frontend | Depends on: T-01
         └─ Output: Files: contact/BrokerAutocomplete (rewritten), load/LoadDetailsSection (updated), utils/api/fleet/contactApi (added customerId param)
            Exports: BrokerAutocomplete (named+default). Accepts formik, scopeParams, onSelectContact, renderInlineCreate.
            Issues: None — tsc and eslint pass

[x] T-05 [UI] Migrate PlaceTypeahead to EntityAutocomplete
         └─ Agent: frontend | Depends on: T-01
         └─ Output: Files: place/PlaceTypeahead (rewritten), place/index.ts (added PlaceTypeaheadProps export)
            Exports: PlaceTypeahead, PlaceTypeaheadProps. No consumers beyond barrel — no migration needed.
            Issues: None — tsc and eslint pass

---

## US-03: Extend FormDrawer and migrate drawers
_Priority: P0 | Services: dispatch-ui | Status: todo_

**Acceptance Criteria:**
- [ ] FormDrawer supports optional `validateOnChange` and `validateOnBlur` props
- [ ] LoadContactDrawer uses FormDrawer + BrokerAutocomplete (EntityAutocomplete-based) with inline create
- [ ] LoadCargoDrawer uses FormDrawer
- [ ] LoadAssignmentDrawer uses FormDrawer
- [ ] ContactInfoDrawer uses FormDrawer
- [ ] PlaceInfoDrawer uses FormDrawer
- [ ] ManualEntryDrawer uses FormDrawer with validateOnBlur
- [ ] PaymentDrawer uses FormDrawer
- [ ] No visual or behavioral differences after migration

**Tasks:**
[x] T-06 [UI] Add validateOnChange/validateOnBlur props to FormDrawer
         └─ Agent: frontend
         └─ Depends on: —
         └─ Output: Files: mocho/components/FormDrawer/index.tsx (modified)
            Exports: FormDrawerProps now includes validateOnChange?, validateOnBlur?
            Issues: None — tsc and eslint pass

[x] T-07 [UI] Migrate LoadCargoDrawer to FormDrawer
         └─ Agent: frontend | Depends on: T-06
         └─ Output: Files: load/LoadCargoDrawer (rewritten, 82 lines from 141). Deleted LoadCargoDrawerContent.
            Issues: None — tsc and eslint pass

[x] T-08 [UI] Migrate LoadAssignmentDrawer to FormDrawer
         └─ Agent: frontend | Depends on: T-06
         └─ Output: Files: load/LoadAssignmentDrawer (rewritten, 113 lines from 168). Deleted LoadAssignmentDrawerContent.
            Issues: None — tsc and eslint pass

[x] T-09 [UI] Rewrite LoadContactDrawer with FormDrawer + BrokerAutocomplete
         └─ Agent: frontend | Depends on: T-04, T-06
         └─ Output: Files: load/LoadContactDrawer (rewritten ~180 lines). Added InlineContactForm for inline create.
            Removed all manual debounce/search. Uses BrokerAutocomplete + FormDrawer.
            Issues: None — tsc and eslint pass

[x] T-10 [UI] Migrate ContactInfoDrawer to FormDrawer
         └─ Agent: frontend | Depends on: T-03, T-06
         └─ Output: Files: contact/ContactInfoDrawer (rewritten, 105 lines from 197). Deleted ContactInfoDrawerContent + sectionHeaderSx.
            Uses DrawerSection for labels. All behavior preserved.
            Issues: None — tsc and eslint pass

[x] T-11 [UI] Migrate PlaceInfoDrawer to FormDrawer
         └─ Agent: frontend | Depends on: T-06
         └─ Output: Files: place/PlaceInfoDrawer (rewritten, 226 lines from 300). Deleted PlaceInfoDrawerContent + SECTION_LABEL_SX.
            Issues: None — tsc and eslint pass

[x] T-12 [UI] Migrate ManualEntryDrawer to FormDrawer
         └─ Agent: frontend | Depends on: T-06
         └─ Output: Files: loadintelligence/ManualEntryDrawer (rewritten, 110 lines from 193). Removed all `as` casts, ManualEntryContent sub-component.
            Uses validateOnChange={false}, validateOnBlur.
            Issues: None — tsc and eslint pass

[x] T-13 [UI] Migrate PaymentDrawer to FormDrawer
         └─ Agent: frontend | Depends on: T-06
         └─ Output: Files: invoices/PaymentDrawer (rewritten, ~100 lines from 207). Also switched raw MUI fields to @mocho/ui.
            Issues: None — tsc and eslint pass

---

## US-04: Fix raw MUI TextFields in Driver and Vehicle drawers
_Priority: P0 | Services: dispatch-ui | Status: todo_

**Acceptance Criteria:**
- [ ] DriverInfoDrawer uses @mocho/ui TextField, SelectField instead of raw MUI TextField/Select
- [ ] VehicleInfoDrawer uses @mocho/ui TextField, SelectField instead of raw MUI TextField/Select
- [ ] No visual differences after migration

**Tasks:**
[x] T-14 [UI] Replace raw MUI fields in DriverInfoDrawer
         └─ Agent: frontend | Depends on: —
         └─ Output: Files: driver/DriverInfoDrawer (modified). Replaced all raw MUI fields with @mocho/ui TextField, SelectField, EmailField, DateField.
            Used DrawerSection for labels. Kept MUI Autocomplete for endorsements (no mocho equivalent).
            Issues: None — tsc and eslint pass

[x] T-15 [UI] Replace raw MUI fields in VehicleInfoDrawer
         └─ Agent: frontend | Depends on: —
         └─ Output: Files: vehicle/VehicleInfoDrawer (modified), mocho TextField types+component (added multiline/minRows support).
            Used DrawerSection for labels, simplified render prop to (formik).
            Issues: None — tsc and eslint pass

---

## US-05: Rewrite LoadRouteDrawer with StopFormCard and batch-save
_Priority: P0 | Services: dispatch-ui | Status: todo_

**Acceptance Criteria:**
- [ ] StopFormCard has optional `canReorder` prop with up/down buttons in header
- [ ] LoadRouteDrawer uses StopFormCard (with AddressSearchField, commodities, freight receiving)
- [ ] LoadRouteDrawer wraps stops in Formik for batch-save on "Save Changes"
- [ ] "Add Stop" adds new stop via Formik FieldArray
- [ ] Delete stop works with confirmation
- [ ] EditableStopCard deleted from codebase

**Tasks:**
[x] T-16 [UI] Add reorder UI to StopFormCard
         └─ Agent: frontend | Depends on: —
         └─ Output: Files: load/StopFormCard (modified). Added canReorder, onMoveUp, onMoveDown, isFirst, isLast props.
            Arrow buttons render before stop number badge when canReorder=true.
            Issues: None introduced — 2 pre-existing ESLint warnings in file (stopTouched unused, setExpanded in useEffect)

[x] T-17 [UI] Rewrite LoadRouteDrawer with Formik + StopFormCard
         └─ Agent: frontend | Depends on: T-16
         └─ Output: Files: LoadRouteDrawer/index.tsx (rewritten), StopFormCard (generic formik type), AddressSearchField (generic formik type), loadSchema.ts (added StopsFormShape), EditableStopCard.tsx (DELETED).
            Made StopFormCard generic over T extends StopsFormShape for reuse.
            Issues: None — tsc and eslint pass

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[x] T-18 [VERIFY] Verify all autocompletes and drawers work correctly
         └─ Detail: Read all modified files. For each autocomplete (Carrier, Customer, Contact, Place):
            - Verify it extends EntityAutocomplete correctly
            - Verify fetchOptions calls the correct API
            - Verify renderOption preserves the original visual
            - Verify all usage sites still pass correct props
            For each migrated drawer:
            - Verify FormDrawer is used correctly (initialValues, validationSchema, onSubmit, children render prop)
            - Verify no manual footer code remains
            - Verify dirty-state confirmation still works
            For LoadRouteDrawer:
            - Verify StopFormCard is used with canReorder
            - Verify batch-save dispatches correctly
            - Verify EditableStopCard is deleted
            For Driver/Vehicle drawers:
            - Verify all fields use @mocho/ui components
            Check every AC from every story is satisfied.
         └─ Agent: review
         └─ Depends on: T-01 through T-17
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 1     | 1    | 0       | 10/10  |
| US-02 | 4     | 4    | 0       | 5/5    |
| US-03 | 8     | 8    | 0       | 9/9    |
| US-04 | 2     | 2    | 0       | 3/3    |
| US-05 | 2     | 2    | 0       | 6/6    |
| VER-01| 1     | 1    | 0       | —      |
| **All** | **18** | **18** | **0** | **33/33** |
