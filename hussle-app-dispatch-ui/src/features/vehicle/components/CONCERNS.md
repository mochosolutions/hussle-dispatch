## Vehicle Component Concerns

### Auto-generate expenseKey from label

`VehicleExpenseDrawer` exposes `expenseKey` as a user-editable field. This is a technical slug used by the API for upsert matching (`assertUniqueExpenseKeys` in `vehicleService.ts`). Users shouldn't need to know about it.

**Current behavior:** User manually types a snake_case key like `truck_payment` alongside the label `Truck Payment`. Existing expenses have the key locked (readOnly).

**Proposed fix:** Auto-derive `expenseKey` from `label` on creation (e.g. `Truck Payment` → `truck_payment`). Hide the field from the UI entirely. On edit, the key is already immutable — no change needed there. The API uniqueness check stays as-is.
