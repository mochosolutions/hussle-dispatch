import { jsx } from "@emotion/react/jsx-runtime";
import { Link } from "@mui/material";
import { Link as Link$1 } from "react-router-dom";
const FormLink = ({
  label,
  to,
  variant = "h6",
  underline = false,
  color
}) => {
  return /* @__PURE__ */ jsx(Link, { variant, component: Link$1, to, color, sx: {
    textDecoration: underline ? "underline" : "none"
  }, children: label });
};
export {
  FormLink
};
//# sourceMappingURL=index.js.map
