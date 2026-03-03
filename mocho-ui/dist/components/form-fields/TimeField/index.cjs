"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const index = require("../BaseFieldWrapper/index.cjs");
const TimeField = ({
  name,
  label,
  disabled = false,
  required = false,
  formik
}) => {
  const error = formik.errors[name];
  const touched = formik.touched[name];
  return /* @__PURE__ */ jsxRuntime.jsx(index.BaseFieldWrapper, { error, label, name, required, touched, children: /* @__PURE__ */ jsxRuntime.jsx(material.OutlinedInput, { disabled, error: Boolean(touched && error), fullWidth: true, id: name, name, notched: true, onBlur: formik.handleBlur, onChange: formik.handleChange, type: "time", value: formik.values[name] || "" }) });
};
exports.TimeField = TimeField;
//# sourceMappingURL=index.cjs.map
