"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const reactRouterDom = require("react-router-dom");
const FormLink = ({
  label,
  to,
  variant = "h6",
  underline = false,
  color
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(material.Link, { variant, component: reactRouterDom.Link, to, color, sx: {
    textDecoration: underline ? "underline" : "none"
  }, children: label });
};
exports.FormLink = FormLink;
//# sourceMappingURL=index.cjs.map
