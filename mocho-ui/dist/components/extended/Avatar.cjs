"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const styles = require("@mui/material/styles");
const MuiAvatar = require("@mui/material/Avatar");
const getColors = require("../../utils/getColors.cjs");
function getColorStyle({
  variant,
  theme,
  color,
  type
}) {
  const colors = getColors(theme, color);
  const {
    lighter,
    light,
    main,
    contrastText
  } = colors;
  switch (type) {
    case "filled":
      return {
        color: contrastText,
        backgroundColor: main
      };
    case "outlined":
      return {
        color: main,
        border: "1px solid",
        borderColor: main,
        backgroundColor: "transparent"
      };
    case "combined":
      return {
        color: main,
        border: "1px solid",
        borderColor: light,
        backgroundColor: lighter
      };
    default:
      return {
        color: main,
        backgroundColor: lighter
      };
  }
}
function getSizeStyle(size) {
  switch (size) {
    case "badge":
      return {
        border: "2px solid",
        fontSize: "0.675rem",
        width: 20,
        height: 20
      };
    case "xs":
      return {
        fontSize: "0.75rem",
        width: 24,
        height: 24
      };
    case "sm":
      return {
        fontSize: "0.875rem",
        width: 32,
        height: 32
      };
    case "lg":
      return {
        fontSize: "1.2rem",
        width: 52,
        height: 52
      };
    case "xl":
      return {
        fontSize: "1.5rem",
        width: 64,
        height: 64
      };
    case "md":
    default:
      return {
        fontSize: "1rem",
        width: 40,
        height: 40
      };
  }
}
const AvatarStyle = styles.styled(MuiAvatar, {
  shouldForwardProp: (prop) => prop !== "color" && prop !== "type" && prop !== "size"
})(({
  theme,
  variant,
  color,
  type,
  size
}) => ({
  ...getSizeStyle(size),
  ...getColorStyle({
    variant,
    theme,
    color,
    type
  }),
  ...size === "badge" && {
    borderColor: theme.palette.background.default
  }
}));
function Avatar({
  variant = "circular",
  children,
  color = "primary",
  type = "outlined",
  size = "md",
  ...others
}) {
  const theme = styles.useTheme();
  return /* @__PURE__ */ jsxRuntime.jsx(AvatarStyle, { variant, theme, color, ...others, children });
}
module.exports = Avatar;
//# sourceMappingURL=Avatar.cjs.map
