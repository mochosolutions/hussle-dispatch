import { useEffect, useImperativeHandle, useRef } from 'react';
import { useFormik, FormikValues } from 'formik';
import type { FormHandle, FormState, FormStateChangeCallback } from '../types/form';

interface UseFormHandleOptions<TValues extends FormikValues> {
  ref: React.ForwardedRef<FormHandle>;
  formik: ReturnType<typeof useFormik<TValues>>;
  onStateChange?: FormStateChangeCallback;
  /**
   * Override how isDirty is determined.
   * Defaults to raw formik.dirty.
   * Edit forms should pass createFormState from useUserInteractionDirty
   * to prevent false positives on initial render.
   */
  getDirty?: () => boolean;
}

/**
 * Wires a formik instance to a forwarded ref and pushes state changes
 * up to the page via onStateChange.
 *
 * Lives inside the form component. Pairs with useFormRef at the page level.
 *
 * IMPORTANT: The form component must be wrapped in forwardRef otherwise
 * the ref will always be null and submit/reset will silently do nothing.
 *
 * @example
 * ```tsx
 * const MyForm = forwardRef<FormHandle, MyFormProps>((props, ref) => {
 *   const formik = useFormik({ ... });
 *   useFormHandle({ ref, formik, onStateChange: props.onStateChange });
 *   return <form>...</form>;
 * });
 * ```
 */
export function useFormHandle<TValues extends FormikValues>({
  ref,
  formik,
  onStateChange,
  getDirty = () => formik.dirty,
}: UseFormHandleOptions<TValues>) {
  // Store getDirty and onStateChange in refs to avoid them as effect deps.
  // getDirty defaults to `() => formik.dirty` which creates a new function
  // each render — using it directly as a dep causes an infinite loop:
  // new getDirty → effect fires → onStateChange → parent setState → re-render → new getDirty
  const getDirtyRef = useRef(getDirty);
  getDirtyRef.current = getDirty;

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useImperativeHandle(
    ref,
    () => ({
      submit: async () => { await formik.submitForm(); },
      reset: () => formik.resetForm(),
      getValues: () => formik.values as unknown as Record<string, unknown>,
      isSubmitting: formik.isSubmitting,
      isValid: formik.isValid,
      isDirty: getDirtyRef.current(),
    }),
    [formik.submitForm, formik.resetForm, formik.values, formik.isSubmitting, formik.isValid]
  );

  // Push form state to the page. Only depends on primitive values from formik
  // to avoid re-firing on every render.
  const isDirty = getDirtyRef.current();
  useEffect(() => {
    const state: FormState = {
      isSubmitting: formik.isSubmitting,
      isValid: formik.isValid,
      isDirty,
    };
    onStateChangeRef.current?.(state);
  }, [formik.isSubmitting, formik.isValid, isDirty]);
}

export default useFormHandle;
