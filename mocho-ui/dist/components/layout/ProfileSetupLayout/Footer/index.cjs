"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const reactRouterDom = require("react-router-dom");
const material = require("@mui/material");
const Footer = () => /* @__PURE__ */ jsxRuntime.jsx("footer", { className: "footer", children: /* @__PURE__ */ jsxRuntime.jsx(material.Container, { children: /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: {
  p: "24px 16px 0px",
  mt: "auto"
}, children: [
  /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "caption", children: "© All rights reserved" }),
  /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 1.5, direction: "row", justifyContent: "space-between", alignItems: "center", children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.Link, { component: reactRouterDom.Link, to: "#", target: "_blank", variant: "caption", color: "textPrimary", children: "About us" }),
    /* @__PURE__ */ jsxRuntime.jsx(material.Link, { component: reactRouterDom.Link, to: "#", target: "_blank", variant: "caption", color: "textPrimary", children: "Privacy" }),
    /* @__PURE__ */ jsxRuntime.jsx(material.Link, { component: reactRouterDom.Link, to: "#", target: "_blank", variant: "caption", color: "textPrimary", children: "Terms" })
  ] })
] }) }) });
module.exports = Footer;
//# sourceMappingURL=index.cjs.map
