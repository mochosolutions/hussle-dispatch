import { jsx } from "@emotion/react/jsx-runtime";
import { Box } from "@mui/material";
const LayoutShell = ({
  children,
  sx
}) => /* @__PURE__ */ jsx(Box, { sx: {
  display: "flex",
  width: "100%",
  ...sx ?? {}
}, children });
export {
  LayoutShell as default
};
//# sourceMappingURL=LayoutShell.js.map
