"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const getColors = require("../../utils/getColors.cjs");
const useTheme = require("../../node_modules/@mui/material/styles/useTheme.cjs");
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
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { component: "span", sx: {
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
module.exports = Dot;
//# sourceMappingURL=Dot.cjs.map
