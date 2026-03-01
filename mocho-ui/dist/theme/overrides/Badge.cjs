"use strict";
const getColors = require("../../utils/getColors.cjs");
function getColorStyle({
  color,
  theme
}) {
  const colors = getColors(theme, color);
  const {
    lighter,
    main
  } = colors;
  return {
    color: main,
    backgroundColor: lighter
  };
}
function Badge(theme) {
  const defaultLightBadge = getColorStyle({
    color: "primary",
    theme
  });
  return {
    MuiBadge: {
      styleOverrides: {
        standard: {
          minWidth: theme.spacing(2),
          height: theme.spacing(2),
          padding: theme.spacing(0.5)
        },
        light: {
          ...defaultLightBadge,
          "&.MuiBadge-colorPrimary": getColorStyle({
            color: "primary",
            theme
          }),
          "&.MuiBadge-colorSecondary": getColorStyle({
            color: "secondary",
            theme
          }),
          "&.MuiBadge-colorError": getColorStyle({
            color: "error",
            theme
          }),
          "&.MuiBadge-colorInfo": getColorStyle({
            color: "info",
            theme
          }),
          "&.MuiBadge-colorSuccess": getColorStyle({
            color: "success",
            theme
          }),
          "&.MuiBadge-colorWarning": getColorStyle({
            color: "warning",
            theme
          })
        }
      }
    }
  };
}
module.exports = Badge;
//# sourceMappingURL=Badge.cjs.map
