"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const CheckboxField = ({
  name,
  label,
  color = "primary",
  formik
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(material.FormControlLabel, { control: /* @__PURE__ */ jsxRuntime.jsx(material.Checkbox, { checked: Boolean(formik.values[name]), onChange: (event) => {
    formik.setFieldValue(name, event.target.checked);
  }, name, color }), label });
};
exports.CheckboxField = CheckboxField;
//# sourceMappingURL=index.cjs.map
