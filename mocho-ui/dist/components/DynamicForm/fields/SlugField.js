import { jsx } from "../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { useEffect } from "react";
import { OutlinedInput } from "@mui/material";
import { getFieldValue } from "../utils.js";
function SlugField({
  field,
  values,
  touched,
  errors,
  handleChange,
  handleBlur,
  setFieldValue
}) {
  const fieldValue = getFieldValue(values, field.name) ?? "";
  const isTouched = getFieldValue(touched, field.name);
  const errorMessage = getFieldValue(errors, field.name);
  const hasError = Boolean(isTouched && errorMessage);
  useEffect(() => {
    const sourceValue = getFieldValue(values, field.sourceField);
    if (sourceValue && !isTouched) {
      const generatedSlug = field.generator(sourceValue);
      setFieldValue(field.name, generatedSlug);
    }
  }, [getFieldValue(values, field.sourceField), isTouched, field.generator, field.name, setFieldValue]);
  return /* @__PURE__ */ jsx(OutlinedInput, { id: field.name, name: field.name, value: fieldValue, onChange: handleChange, onBlur: handleBlur, placeholder: field.placeholder, disabled: field.disabled, fullWidth: true, error: hasError });
}
export {
  SlugField
};
//# sourceMappingURL=SlugField.js.map
