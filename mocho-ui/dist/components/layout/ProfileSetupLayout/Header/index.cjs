"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const index = require("../../../Logo/index.cjs");
const Header = () => /* @__PURE__ */ jsxRuntime.jsx("div", { className: "header", style: {
  gridArea: "header",
  height: "80px"
}, children: /* @__PURE__ */ jsxRuntime.jsx(material.Container, { children: /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: {
  width: "100%",
  // height: '80px',
  alignItems: "center",
  justifyContent: "space-between"
  // display: { xs: 'flex', md: 'none' },
  // borderBottom: "1px solid rgba(34,38,63,.149)",
}, children: /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { sx: {
  textAlign: "left",
  display: "inline-block"
}, children: /* @__PURE__ */ jsxRuntime.jsx(index.Logo, { reverse: true, to: "/" }) }) }) }) });
module.exports = Header;
//# sourceMappingURL=index.cjs.map
