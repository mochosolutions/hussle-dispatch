import { jsx } from "@emotion/react/jsx-runtime";
import { FormControlLabel, Checkbox } from "@mui/material";
const CheckboxField = ({
  name,
  label,
  color = "primary",
  formik
}) => {
  return /* @__PURE__ */ jsx(FormControlLabel, { control: /* @__PURE__ */ jsx(Checkbox, { checked: Boolean(formik.values[name]), onChange: (event) => {
    formik.setFieldValue(name, event.target.checked);
  }, name, color }), label });
};
export {
  CheckboxField
};
//# sourceMappingURL=index.js.map
