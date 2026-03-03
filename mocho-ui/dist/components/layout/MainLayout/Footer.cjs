"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const reactRouterDom = require("react-router-dom");
const material = require("@mui/material");
const Footer = ({
  children,
  copyright,
  links
}) => {
  if (children) {
    return /* @__PURE__ */ jsxRuntime.jsx(material.Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: {
      p: "24px 16px 0px",
      mt: "auto"
    }, children });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: {
    p: "24px 16px 0px",
    mt: "auto"
  }, children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "caption", children: copyright ?? "© All rights reserved" }),
    links && links.length > 0 && /* @__PURE__ */ jsxRuntime.jsx(material.Stack, { spacing: 1.5, direction: "row", justifyContent: "space-between", alignItems: "center", children: links.map((link) => link.external ? /* @__PURE__ */ jsxRuntime.jsx(material.Link, { href: link.href, target: "_blank", rel: "noopener noreferrer", variant: "caption", color: "textPrimary", children: link.label }, link.label) : /* @__PURE__ */ jsxRuntime.jsx(material.Link, { component: reactRouterDom.Link, to: link.href, variant: "caption", color: "textPrimary", children: link.label }, link.label)) })
  ] });
};
module.exports = Footer;
//# sourceMappingURL=Footer.cjs.map
