import { jsx } from "@emotion/react/jsx-runtime";
import { OutlinedInput } from "@mui/material";
import { BaseFieldWrapper } from "../BaseFieldWrapper/index.js";
const DateField = ({
  name,
  label,
  disabled = false,
  required = false,
  formik
}) => {
  const error = formik.errors[name];
  const touched = formik.touched[name];
  return /* @__PURE__ */ jsx(BaseFieldWrapper, { error, label, name, required, touched, children: /* @__PURE__ */ jsx(OutlinedInput, { disabled, error: Boolean(touched && error), fullWidth: true, id: name, name, notched: true, onBlur: formik.handleBlur, onChange: formik.handleChange, type: "date", value: formik.values[name] || "" }) });
};
export {
  DateField
};
//# sourceMappingURL=index.js.map
