import { useRef, useState, useCallback, useMemo } from "react";
const INITIAL_FORM_STATE = {
  isSubmitting: false,
  isValid: false,
  isDirty: false
};
function useFormRef() {
  const formRef = useRef(null);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const handleFormStateChange = useCallback((state) => {
    setFormState(state);
  }, []);
  const submitForm = useCallback(() => {
    formRef.current?.submit();
  }, []);
  const resetForm = useCallback(() => {
    formRef.current?.reset();
  }, []);
  const isSaveDisabled = useMemo(() => formState.isSubmitting || !formState.isValid, [formState.isSubmitting, formState.isValid]);
  const saveButtonText = useCallback((defaultText, submittingText = "Saving...") => {
    return formState.isSubmitting ? submittingText : defaultText;
  }, [formState.isSubmitting]);
  return {
    formRef,
    formState,
    handleFormStateChange,
    submitForm,
    resetForm,
    isSaveDisabled,
    saveButtonText
  };
}
export {
  useFormRef as default,
  useFormRef
};
//# sourceMappingURL=useFormRef.js.map
