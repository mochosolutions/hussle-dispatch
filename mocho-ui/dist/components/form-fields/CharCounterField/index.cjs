"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const index = require("../BaseFieldWrapper/index.cjs");
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
  return /* @__PURE__ */ jsxRuntime.jsxs(index.BaseFieldWrapper, { name, label, required, error, touched, children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.TextField, { id: name, name, value, onChange: formik.handleChange, onBlur: formik.handleBlur, placeholder, disabled, multiline: true, rows, fullWidth: true, error: Boolean(touched && error), inputProps: {
      maxLength
    } }),
    /* @__PURE__ */ jsxRuntime.jsxs(material.FormHelperText, { children: [
      charCount,
      "/",
      maxLength,
      " characters"
    ] })
  ] });
};
exports.CharCounterField = CharCounterField;
//# sourceMappingURL=index.cjs.map
