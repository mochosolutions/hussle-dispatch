"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const getColors = require("../../utils/getColors.cjs");
const Dot = ({
  color,
  size,
  variant,
  sx
}) => {
  const theme = styles.useTheme();
  const colors = getColors(theme, color || "primary");
  const {
    main
  } = colors;
  return /* @__PURE__ */ jsxRuntime.jsx(material.Box, { component: "span", sx: {
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
