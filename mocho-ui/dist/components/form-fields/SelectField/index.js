import { jsx } from "@emotion/react/jsx-runtime";
import { Select, MenuItem } from "@mui/material";
import { BaseFieldWrapper } from "../BaseFieldWrapper/index.js";
const SelectField = ({
  name,
  label,
  data,
  required = false,
  formik
}) => {
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const handleChange = (event) => {
    formik.setFieldValue(name, event.target.value);
  };
  return /* @__PURE__ */ jsx(BaseFieldWrapper, { name, label, required, error, touched, children: /* @__PURE__ */ jsx(Select, { id: name, name, value: formik.values[name] || "", onChange: handleChange, onBlur: formik.handleBlur, fullWidth: true, error: Boolean(touched && error), children: data.map((item) => /* @__PURE__ */ jsx(MenuItem, { value: item.value, children: item.label }, item.value)) }) });
};
export {
  SelectField
};
//# sourceMappingURL=index.js.map
