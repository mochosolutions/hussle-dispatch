"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const React = require("react");
const INITIAL_FORM_STATE = {
  isSubmitting: false,
  isValid: false,
  isDirty: false
};
function useFormRef() {
  const formRef = React.useRef(null);
  const [formState, setFormState] = React.useState(INITIAL_FORM_STATE);
  const handleFormStateChange = React.useCallback((state) => {
    setFormState(state);
  }, []);
  const submitForm = React.useCallback(() => {
    formRef.current?.submit();
  }, []);
  const resetForm = React.useCallback(() => {
    formRef.current?.reset();
  }, []);
  const isSaveDisabled = React.useMemo(() => formState.isSubmitting || !formState.isValid, [formState.isSubmitting, formState.isValid]);
  const saveButtonText = React.useCallback((defaultText, submittingText = "Saving...") => {
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
exports.default = useFormRef;
exports.useFormRef = useFormRef;
//# sourceMappingURL=useFormRef.cjs.map
