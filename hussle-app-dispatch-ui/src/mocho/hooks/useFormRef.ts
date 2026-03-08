import { useRef, useState, useCallback } from 'react';
import type { FormHandle, FormState, FormStateChangeCallback } from '../types/form';

const INITIAL_FORM_STATE: FormState = {
  isSubmitting: false,
  isValid: false,
  isDirty: false,
  isLoading: false,
};

export interface UseFormRefReturn<T extends FormHandle = FormHandle> {
  formRef: React.RefObject<T>;
  formState: FormState;
  handleFormStateChange: FormStateChangeCallback;
  submitForm: () => void;
  resetForm: () => void;
}

/**
 * Creates an external handle for a form component rendered elsewhere in the tree.
 * Lives at the page level. Pairs with useFormHandle inside the form component.
 *
 * @example
 * ```tsx
 * const { formRef, formState, handleFormStateChange, submitForm } = useFormRef();
 *
 * const isSaveDisabled = formState.isSubmitting || !formState.isDirty;
 *
 * <Button onClick={submitForm} disabled={isSaveDisabled}>
 *   {formState.isSubmitting ? 'Saving...' : 'Save'}
 * </Button>
 * <MyForm ref={formRef} onStateChange={handleFormStateChange} />
 * ```
 */
export function useFormRef<T extends FormHandle = FormHandle>(): UseFormRefReturn<T> {
  const formRef = useRef<T>(null) as React.RefObject<T>;
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);

  const handleFormStateChange = useCallback<FormStateChangeCallback>((state) => {
    setFormState(state);
  }, []);

  const submitForm = useCallback(() => {
    formRef.current?.submit();
  }, []);

  const resetForm = useCallback(() => {
    formRef.current?.reset();
  }, []);

  return { formRef, formState, handleFormStateChange, submitForm, resetForm };
}

export default useFormRef;