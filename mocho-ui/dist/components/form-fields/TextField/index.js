import { jsx } from "@emotion/react/jsx-runtime";
import { OutlinedInput } from "@mui/material";
import { BaseFieldWrapper } from "../BaseFieldWrapper/index.js";
const TextField = ({
  name,
  label,
  placeholder,
  disabled = false,
  required = false,
  type = "text",
  formik
}) => {
  const error = formik.errors[name];
  const touched = formik.touched[name];
  return /* @__PURE__ */ jsx(BaseFieldWrapper, { name, label, required, error, touched, children: /* @__PURE__ */ jsx(OutlinedInput, { id: name, name, type, value: formik.values[name] || "", onChange: formik.handleChange, onBlur: formik.handleBlur, placeholder, disabled, fullWidth: true, error: Boolean(touched && error) }) });
};
export {
  TextField
};
//# sourceMappingURL=index.js.map
