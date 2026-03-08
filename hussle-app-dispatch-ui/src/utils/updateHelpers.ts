/**
 * Update Helpers
 *
 * Generic utilities for building partial update payloads.
 * Only includes fields that have actually changed, enabling proper
 * partial update semantics where unchanged relationships are preserved.
 */

/**
 * Compare two arrays for equality (order-independent)
 *
 * @param a - First array
 * @param b - Second array
 * @returns true if arrays contain the same elements
 */
export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
};

/**
 * Compare two values for equality (handles primitives, arrays, null/undefined)
 *
 * @param submitted - Value from form submission
 * @param original - Original value from entity
 * @param extractFn - Optional function to extract comparable value from original
 *                    (e.g., extract IDs from objects in M2M relationships)
 * @returns true if values are equal
 */
export const valuesEqual = (
  submitted: unknown,
  original: unknown,
  extractFn?: (item: unknown) => unknown
): boolean => {
  // Apply extraction function if provided (e.g., get IDs from objects)
  const originalValue =
    extractFn && Array.isArray(original) ? original.map(extractFn) : original;

  // Same reference or both same primitive
  if (submitted === originalValue) return true;

  // Both null/undefined
  if ((submitted === null || submitted === undefined) && (originalValue === null || originalValue === undefined)) return true;

  // Array comparison (order-independent)
  if (Array.isArray(submitted) && Array.isArray(originalValue)) {
    return arraysEqual(submitted, originalValue as unknown[]);
  }

  return false;
};

/**
 * Build update payload with ONLY changed fields
 *
 * This function compares submitted form values against the original entity
 * and returns a new object containing only the fields that have changed.
 * This enables proper partial update semantics where:
 * - If `authors` is **not in the payload** → existing relationships stay unchanged
 * - If `authors` is **in the payload** → relationships are replaced with the new values
 *
 * @param submitted - Form values submitted by user
 * @param original - Original entity from Redux store
 * @param fieldMappings - Optional: how to extract comparable values from original.
 *                        Only needed when original has objects but form sends IDs.
 *                        Example: { authors: (a) => a.id, categories: (c) => c.id }
 * @returns Object containing only the changed fields
 *
 * @example
 * // Form sends author IDs, but Redux stores author objects
 * const changedFields = buildChangedFieldsPayload(
 *   formValues,
 *   originalPost,
 *   {
 *     authors: (a) => a.id,
 *     categories: (c) => c.id,
 *   }
 * );
 *
 * @example
 * // Simple case - all fields are primitives or ID arrays
 * const changedFields = buildChangedFieldsPayload(formValues, originalEntity);
 */
export const buildChangedFieldsPayload = <T extends Record<string, unknown>>(
  submitted: T,
  original: Record<string, unknown>,
  fieldMappings?: Record<string, (item: unknown) => unknown>
): Partial<T> => {
  const changed: Partial<T> = {};

  // Iterate ALL submitted fields - fully generic
  for (const [key, value] of Object.entries(submitted)) {
    const extractFn = fieldMappings?.[key];

    if (!valuesEqual(value, original[key], extractFn)) {
      changed[key as keyof T] = value as T[keyof T];
    }
  }

  return changed;
};
