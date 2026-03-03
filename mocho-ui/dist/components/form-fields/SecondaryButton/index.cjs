"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const SecondaryButton = ({
  label,
  onClick,
  variant = "text"
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { onClick, variant: "body1", sx: {
    minWidth: 85,
    ml: 2,
    textDecoration: variant === "outlined" ? "underline" : "none",
    cursor: "pointer"
  }, color: "primary", children: label });
};
exports.SecondaryButton = SecondaryButton;
//# sourceMappingURL=index.cjs.map
