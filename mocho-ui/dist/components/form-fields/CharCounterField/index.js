import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { TextField, FormHelperText } from "@mui/material";
import { BaseFieldWrapper } from "../BaseFieldWrapper/index.js";
const CharCounterField = ({
  name,
  label,
  maxLength,
  rows = 4,
  placeholder,
  disabled = false,
  required = false,
  formik
}) => {
  const value = formik.values[name] || "";
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const charCount = value.length;
  return /* @__PURE__ */ jsxs(BaseFieldWrapper, { name, label, required, error, touched, children: [
    /* @__PURE__ */ jsx(TextField, { id: name, name, value, onChange: formik.handleChange, onBlur: formik.handleBlur, placeholder, disabled, multiline: true, rows, fullWidth: true, error: Boolean(touched && error), inputProps: {
      maxLength
    } }),
    /* @__PURE__ */ jsxs(FormHelperText, { children: [
      charCount,
      "/",
      maxLength,
      " characters"
    ] })
  ] });
};
export {
  CharCounterField
};
//# sourceMappingURL=index.js.map
