"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const reactRouterDom = require("react-router-dom");
const TermsNotice = ({
  termsLink,
  privacyLink,
  customText = "By Signing up, you agree to our"
}) => {
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Typography, { variant: "body2", children: [
    customText,
    "  ",
    /* @__PURE__ */ jsxRuntime.jsx(material.Link, { variant: "subtitle2", component: reactRouterDom.Link, to: termsLink, children: "Terms of Service" }),
    "  and  ",
    /* @__PURE__ */ jsxRuntime.jsx(material.Link, { variant: "subtitle2", component: reactRouterDom.Link, to: privacyLink, children: "Privacy Policy" })
  ] });
};
exports.TermsNotice = TermsNotice;
//# sourceMappingURL=index.cjs.map
