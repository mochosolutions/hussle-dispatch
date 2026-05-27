import { NotFoundError } from '@/shared/errors';

/**
 * Asserts that a lookup resolved to a non-null entity.
 * Throws NotFoundError with a standardized message if the entity is null or undefined.
 *
 * @param entity - The result of a lookup (may be null or undefined)
 * @param entityName - Human-readable name for the error message (e.g., 'Carrier', 'Driver')
 */
export function assertEntityExists<T>(
  entity: T | null | undefined,
  entityName: string,
): asserts entity is T {
  if (entity === null || entity === undefined) {
    throw new NotFoundError(`${entityName} not found.`);
  }
}
