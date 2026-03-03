import { jsx } from "@emotion/react/jsx-runtime";
import { Typography } from "@mui/material";
const SecondaryButton = ({
  label,
  onClick,
  variant = "text"
}) => {
  return /* @__PURE__ */ jsx(Typography, { onClick, variant: "body1", sx: {
    minWidth: 85,
    ml: 2,
    textDecoration: variant === "outlined" ? "underline" : "none",
    cursor: "pointer"
  }, color: "primary", children: label });
};
export {
  SecondaryButton
};
//# sourceMappingURL=index.js.map
