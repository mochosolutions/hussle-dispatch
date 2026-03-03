import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { Typography, Link } from "@mui/material";
import { Link as Link$1 } from "react-router-dom";
const TermsNotice = ({
  termsLink,
  privacyLink,
  customText = "By Signing up, you agree to our"
}) => {
  return /* @__PURE__ */ jsxs(Typography, { variant: "body2", children: [
    customText,
    "  ",
    /* @__PURE__ */ jsx(Link, { variant: "subtitle2", component: Link$1, to: termsLink, children: "Terms of Service" }),
    "  and  ",
    /* @__PURE__ */ jsx(Link, { variant: "subtitle2", component: Link$1, to: privacyLink, children: "Privacy Policy" })
  ] });
};
export {
  TermsNotice
};
//# sourceMappingURL=index.js.map
