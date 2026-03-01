import { jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { Box } from "@mui/material";
import getColors from "../../utils/getColors.js";
import useTheme from "../../node_modules/@mui/material/styles/useTheme.js";
const Dot = ({
  color,
  size,
  variant,
  sx
}) => {
  const theme = useTheme();
  const colors = getColors(theme, color || "primary");
  const {
    main
  } = colors;
  return /* @__PURE__ */ jsx(Box, { component: "span", sx: {
    width: size || 8,
    height: size || 8,
    borderRadius: "50%",
    bgcolor: variant === "outlined" ? "" : main,
    ...variant === "outlined" && {
      border: `1px solid ${main}`
    },
    ...sx
  } });
};
export {
  Dot as default
};
//# sourceMappingURL=Dot.js.map
