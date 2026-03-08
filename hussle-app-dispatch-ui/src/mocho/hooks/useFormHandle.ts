import { useEffect, useImperativeHandle } from 'react';
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
  useImperativeHandle(
    ref,
    () => ({
      submit: async () => { await formik.submitForm(); },
      reset: () => formik.resetForm(),
      isSubmitting: formik.isSubmitting,
      isValid: formik.isValid,
      isDirty: getDirty(),
    }),
    [formik.submitForm, formik.resetForm, formik.isSubmitting, formik.isValid, getDirty]
  );

  useEffect(() => {
    const state: FormState = {
      isSubmitting: formik.isSubmitting,
      isValid: formik.isValid,
      isDirty: getDirty(),
    };
    onStateChange?.(state);
  }, [formik.isSubmitting, formik.isValid, getDirty, onStateChange]);
}

export default useFormHandle;