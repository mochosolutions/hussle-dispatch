"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const getColors = require("../../utils/getColors.cjs");
function getVariantStyle({
  color,
  theme,
  labelColor
}) {
  const colors = getColors(theme, color);
  const {
    main,
    contrastText
  } = colors;
  const colorValue = color ? color : "";
  if (["primary", "secondary", "info", "success", "warning", "error"].includes(colorValue)) {
    return {
      [`& .${material.tooltipClasses.tooltip}`]: {
        backgroundColor: main,
        color: labelColor ? labelColor : contrastText
      },
      [`& .${material.tooltipClasses.arrow}`]: {
        color: main
      }
    };
  } else {
    return {
      [`& .${material.tooltipClasses.tooltip}`]: {
        backgroundColor: colorValue,
        color: labelColor ? labelColor : contrastText,
        boxShadow: theme.shadows[1]
      },
      [`& .${material.tooltipClasses.arrow}`]: {
        color: colorValue
      }
    };
  }
}
const TooltipStyle = styles.styled(({
  className,
  ...props
}) => /* @__PURE__ */ jsxRuntime.jsx(material.Tooltip, { ...props, classes: {
  popper: className
} }), {
  shouldForwardProp: (prop) => prop !== "color" && prop !== "labelColor"
})(({
  theme,
  color,
  labelColor
}) => ({
  ...color && getVariantStyle({
    color,
    theme,
    labelColor
  })
}));
function CustomTooltip({
  children,
  arrow,
  labelColor = "",
  ...rest
}) {
  const theme = styles.useTheme();
  return /* @__PURE__ */ jsxRuntime.jsx(material.Box, { display: "flex", children: /* @__PURE__ */ jsxRuntime.jsx(TooltipStyle, { arrow, ...rest, theme, labelColor, children }) });
}
module.exports = CustomTooltip;
//# sourceMappingURL=Tooltip.cjs.map
