// Public re-export of LOCKS_FIELDS for non-engine consumers.
//
// The canonical list lives at `engine/types.ts`. This file exists so step renderers and
// services that aren't allowed to import directly from `engine/` (for purity reasons)
// can still reference the locked-field set.

export { LOCKS_FIELDS, type LockedFieldPath } from '../engine/types';
