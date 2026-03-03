"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const FormError = ({
  error
}) => {
  if (!error) return null;
  return /* @__PURE__ */ jsxRuntime.jsx(material.Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { error: true, children: error }) });
};
exports.FormError = FormError;
//# sourceMappingURL=index.cjs.map
