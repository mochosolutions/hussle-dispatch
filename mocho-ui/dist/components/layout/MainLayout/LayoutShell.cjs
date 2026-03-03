"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const LayoutShell = ({
  children,
  sx
}) => /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: {
  display: "flex",
  width: "100%",
  ...sx ?? {}
}, children });
module.exports = LayoutShell;
//# sourceMappingURL=LayoutShell.cjs.map
