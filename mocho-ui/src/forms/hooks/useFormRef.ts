import { useRef, useState, useCallback, useMemo } from 'react';
import type { FormHandle, FormState, FormStateChangeCallback } from '../types/form';

/**
 * Initial form state (before form mounts)
 */
const INITIAL_FORM_STATE: FormState = {
  isSubmitting: false,
  isValid: false,
  isDirty: false,
};

/**
 * Return type for useFormRef hook
 */
export interface UseFormRefReturn<T extends FormHandle = FormHandle> {
  /** Ref to pass to form component's ref prop */
  formRef: React.RefObject<T>;
  /** Current form state (synced via onStateChange callback) */
  formState: FormState;
  /** Memoized callback to pass to form's onStateChange prop */
  handleFormStateChange: FormStateChangeCallback;
  /** Convenience method to trigger form submission via ref */
  submitForm: () => void;
  /** Convenience method to reset form via ref */
  resetForm: () => void;
  /** Whether the save button should be disabled */
  isSaveDisabled: boolean;
  /** Button text based on submitting state */
  saveButtonText: (defaultText: string, submittingText?: string) => string;
}

/**
 * Hook to manage form refs for external form submission.
 *
 * This hook solves the problem of submit buttons located outside the form element
 * (e.g., in PageHeader) by providing a ref-based submission pattern.
 *
 * @example
 * ```tsx
 * const MyPage = () => {
 *   const { formRef, formState, handleFormStateChange, submitForm, isSaveDisabled } = useFormRef();
 *
 *   const headerActions = (
 *     <Button onClick={submitForm} disabled={isSaveDisabled}>
 *       {formState.isSubmitting ? 'Saving...' : 'Save'}
 *     </Button>
 *   );
 *
 *   return (
 *     <PageWrapper>
 *       <PageHeader headerActions={headerActions} />
 *       <MyForm ref={formRef} onStateChange={handleFormStateChange} />
 *     </PageWrapper>
 *   );
 * };
 * ```
 *
 * @template T - Form handle type (defaults to FormHandle)
 * @returns Object containing formRef, formState, and helper methods
 */
export function useFormRef<T extends FormHandle = FormHandle>(): UseFormRefReturn<T> {
  // Using type assertion because React's forwardRef expects RefObject<T> but useRef(null) returns RefObject<T | null>
  const formRef = useRef<T>(null) as React.RefObject<T>;
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);

  /**
   * Callback to sync form state from the form component.
   * Memoized to prevent unnecessary re-renders in the form component.
   */
  const handleFormStateChange = useCallback<FormStateChangeCallback>((state) => {
    setFormState(state);
  }, []);

  /**
   * Trigger form submission via ref.
   * Safe to call even if ref is not yet connected.
   */
  const submitForm = useCallback(() => {
    formRef.current?.submit();
  }, []);

  /**
   * Reset form to initial values via ref.
   * Safe to call even if ref is not yet connected.
   */
  const resetForm = useCallback(() => {
    formRef.current?.reset();
  }, []);

  /**
   * Whether the save/submit button should be disabled.
   * Disabled when submitting or form is invalid.
   */
  const isSaveDisabled = useMemo(
    () => formState.isSubmitting || !formState.isValid,
    [formState.isSubmitting, formState.isValid]
  );

  /**
   * Helper to generate button text based on submitting state.
   */
  const saveButtonText = useCallback(
    (defaultText: string, submittingText = 'Saving...') => {
      return formState.isSubmitting ? submittingText : defaultText;
    },
    [formState.isSubmitting]
  );

  return {
    formRef,
    formState,
    handleFormStateChange,
    submitForm,
    resetForm,
    isSaveDisabled,
    saveButtonText,
  };
}

export default useFormRef;
