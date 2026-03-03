import { jsx } from "@emotion/react/jsx-runtime";
import { Typography } from "@mui/material";
const HelperText = ({
  text,
  variant = "caption",
  color
}) => {
  return /* @__PURE__ */ jsx(Typography, { variant, color, children: text });
};
export {
  HelperText
};
//# sourceMappingURL=index.js.map
