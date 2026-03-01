import { jsx, jsxs } from "../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { Link as Link$1 } from "react-router-dom";
import { Container, Typography, Stack, Link } from "@mui/material";
const Footer = () => /* @__PURE__ */ jsx("footer", { className: "footer", children: /* @__PURE__ */ jsx(Container, { children: /* @__PURE__ */ jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: {
  p: "24px 16px 0px",
  mt: "auto"
}, children: [
  /* @__PURE__ */ jsx(Typography, { variant: "caption", children: "© All rights reserved" }),
  /* @__PURE__ */ jsxs(Stack, { spacing: 1.5, direction: "row", justifyContent: "space-between", alignItems: "center", children: [
    /* @__PURE__ */ jsx(Link, { component: Link$1, to: "#", target: "_blank", variant: "caption", color: "textPrimary", children: "About us" }),
    /* @__PURE__ */ jsx(Link, { component: Link$1, to: "#", target: "_blank", variant: "caption", color: "textPrimary", children: "Privacy" }),
    /* @__PURE__ */ jsx(Link, { component: Link$1, to: "#", target: "_blank", variant: "caption", color: "textPrimary", children: "Terms" })
  ] })
] }) }) });
export {
  Footer as default
};
//# sourceMappingURL=index.js.map
