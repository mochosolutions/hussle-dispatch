"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const index = require("../../../Logo/index.cjs");
const Header = () => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("div", { className: "header", style: {
  gridArea: "header",
  height: "80px"
}, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Container, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { sx: {
  width: "100%",
  // height: '80px',
  alignItems: "center",
  justifyContent: "space-between"
  // display: { xs: 'flex', md: 'none' },
  // borderBottom: "1px solid rgba(34,38,63,.149)",
}, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { sx: {
  textAlign: "left",
  display: "inline-block"
}, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index.Logo, { reverse: true, to: "/" }) }) }) }) });
module.exports = Header;
//# sourceMappingURL=index.cjs.map
