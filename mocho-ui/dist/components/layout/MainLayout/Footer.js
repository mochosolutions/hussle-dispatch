import { jsx, jsxs } from "@emotion/react/jsx-runtime";
import { Link as Link$1 } from "react-router-dom";
import { Stack, Typography, Link } from "@mui/material";
const Footer = ({
  children,
  copyright,
  links
}) => {
  if (children) {
    return /* @__PURE__ */ jsx(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: {
      p: "24px 16px 0px",
      mt: "auto"
    }, children });
  }
  return /* @__PURE__ */ jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: {
    p: "24px 16px 0px",
    mt: "auto"
  }, children: [
    /* @__PURE__ */ jsx(Typography, { variant: "caption", children: copyright ?? "© All rights reserved" }),
    links && links.length > 0 && /* @__PURE__ */ jsx(Stack, { spacing: 1.5, direction: "row", justifyContent: "space-between", alignItems: "center", children: links.map((link) => link.external ? /* @__PURE__ */ jsx(Link, { href: link.href, target: "_blank", rel: "noopener noreferrer", variant: "caption", color: "textPrimary", children: link.label }, link.label) : /* @__PURE__ */ jsx(Link, { component: Link$1, to: link.href, variant: "caption", color: "textPrimary", children: link.label }, link.label)) })
  ] });
};
export {
  Footer as default
};
//# sourceMappingURL=Footer.js.map
