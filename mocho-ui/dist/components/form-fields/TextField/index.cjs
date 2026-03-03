"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const index = require("../BaseFieldWrapper/index.cjs");
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
  return /* @__PURE__ */ jsxRuntime.jsx(index.BaseFieldWrapper, { name, label, required, error, touched, children: /* @__PURE__ */ jsxRuntime.jsx(material.OutlinedInput, { id: name, name, type, value: formik.values[name] || "", onChange: formik.handleChange, onBlur: formik.handleBlur, placeholder, disabled, fullWidth: true, error: Boolean(touched && error) }) });
};
exports.TextField = TextField;
//# sourceMappingURL=index.cjs.map
