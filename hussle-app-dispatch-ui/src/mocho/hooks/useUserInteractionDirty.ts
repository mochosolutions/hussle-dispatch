import { useState, useCallback } from 'react';
import type { FormState } from '../types/form';

/**
 * Prevents false dirty state by tracking actual user interaction.
 *
 * Formik marks dirty:true the moment values differ from initialValues.
 * In edit mode this causes false positives when async data loads and
 * reinitializes the form. This hook ensures isDirty is only true after
 * the user has actually changed a field.
 *
 * Lives in edit form components only. Create forms do not need this.
 *
 * @example
 * ```tsx
 * const { wrapHandler, createFormState, resetTracking } = useUserInteractionDirty();
 *
 * // Wrap handlers to track interaction
 * <input onChange={wrapHandler(formik.handleChange)} />
 *
 * // Pass to useFormHandle to override dirty logic
 * useFormHandle({
 *   ref,
 *   formik,
 *   getDirty: () => createFormState({
 *     isSubmitting: formik.isSubmitting,
 *     isValid: formik.isValid,
 *     isDirty: formik.dirty,
 *   }).isDirty,
 * });
 * ```
 */
export function useUserInteractionDirty() {
  const [hasInteracted, setHasInteracted] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapHandler = useCallback(<T extends (...args: any[]) => any>(handler: T): T => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((...args: any[]) => {
      setHasInteracted(true);
      return handler(...args);
    }) as T;
  }, []);

  const resetTracking = useCallback(() => setHasInteracted(false), []);

  const createFormState = useCallback(
    (formikState: FormState): FormState => ({
      ...formikState,
      isDirty: hasInteracted && formikState.isDirty,
    }),
    [hasInteracted]
  );

  return { hasInteracted, wrapHandler, resetTracking, createFormState };
}

export default useUserInteractionDirty;