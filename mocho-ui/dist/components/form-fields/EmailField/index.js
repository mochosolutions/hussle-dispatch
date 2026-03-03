import { jsx } from "@emotion/react/jsx-runtime";
import { OutlinedInput } from "@mui/material";
import { BaseFieldWrapper } from "../BaseFieldWrapper/index.js";
const EmailField = ({
  name,
  label,
  placeholder = "Enter email address",
  disabled = false,
  required = false,
  formik
}) => {
  const error = formik.errors[name];
  const touched = formik.touched[name];
  return /* @__PURE__ */ jsx(BaseFieldWrapper, { name, label, required, error, touched, children: /* @__PURE__ */ jsx(OutlinedInput, { id: name, name, type: "email", value: formik.values[name] || "", onChange: formik.handleChange, onBlur: formik.handleBlur, placeholder, disabled, fullWidth: true, error: Boolean(touched && error) }) });
};
export {
  EmailField
};
//# sourceMappingURL=index.js.map
