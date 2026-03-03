"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const BaseFieldWrapper = ({
  name,
  label,
  required = false,
  error,
  touched,
  helperText,
  children
}) => {
  const hasError = Boolean(touched && error);
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.InputLabel, { htmlFor: name, required, children: label }),
    children,
    hasError && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { error: true, id: `helper-text-${name}`, children: error }),
    !hasError && helperText && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { id: `helper-text-${name}`, children: helperText })
  ] });
};
exports.BaseFieldWrapper = BaseFieldWrapper;
//# sourceMappingURL=index.cjs.map
