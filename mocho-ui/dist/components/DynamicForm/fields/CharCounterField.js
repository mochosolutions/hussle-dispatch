import { jsxs, Fragment, jsx } from "@emotion/react/jsx-runtime";
import { TextField, FormHelperText } from "@mui/material";
import { getFieldValue } from "../utils.js";
function CharCounterField({
  field,
  values,
  touched,
  errors,
  handleChange,
  handleBlur
}) {
  const fieldValue = getFieldValue(values, field.name) ?? "";
  const isTouched = getFieldValue(touched, field.name);
  const errorMessage = getFieldValue(errors, field.name);
  const hasError = Boolean(isTouched && errorMessage);
  const charCount = typeof fieldValue === "string" ? fieldValue.length : 0;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(TextField, { id: field.name, name: field.name, value: fieldValue, onChange: handleChange, onBlur: handleBlur, placeholder: field.placeholder, disabled: field.disabled, multiline: true, rows: field.rows || 4, fullWidth: true, error: hasError, inputProps: {
      maxLength: field.maxLength,
      minLength: field.minLength
    } }),
    /* @__PURE__ */ jsxs(FormHelperText, { children: [
      charCount,
      " / ",
      field.maxLength,
      " characters"
    ] })
  ] });
}
export {
  CharCounterField
};
//# sourceMappingURL=CharCounterField.js.map
