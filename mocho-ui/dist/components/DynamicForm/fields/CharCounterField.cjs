"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const utils = require("../utils.cjs");
function CharCounterField({
  field,
  values,
  touched,
  errors,
  handleChange,
  handleBlur
}) {
  const fieldValue = utils.getFieldValue(values, field.name) ?? "";
  const isTouched = utils.getFieldValue(touched, field.name);
  const errorMessage = utils.getFieldValue(errors, field.name);
  const hasError = Boolean(isTouched && errorMessage);
  const charCount = typeof fieldValue === "string" ? fieldValue.length : 0;
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.TextField, { id: field.name, name: field.name, value: fieldValue, onChange: handleChange, onBlur: handleBlur, placeholder: field.placeholder, disabled: field.disabled, multiline: true, rows: field.rows || 4, fullWidth: true, error: hasError, inputProps: {
      maxLength: field.maxLength,
      minLength: field.minLength
    } }),
    /* @__PURE__ */ jsxRuntime.jsxs(material.FormHelperText, { children: [
      charCount,
      " / ",
      field.maxLength,
      " characters"
    ] })
  ] });
}
exports.CharCounterField = CharCounterField;
//# sourceMappingURL=CharCounterField.cjs.map
