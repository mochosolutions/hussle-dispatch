"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const getColors = require("../../utils/getColors.cjs");
const useTheme = require("../../node_modules/@mui/material/styles/useTheme.cjs");
const styled = require("../../node_modules/@mui/material/styles/styled.cjs");
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
const TooltipStyle = styled.default(({
  className,
  ...props
}) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { ...props, classes: {
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
  const theme = useTheme();
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { display: "flex", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(TooltipStyle, { arrow, ...rest, theme, labelColor, children }) });
}
module.exports = CustomTooltip;
//# sourceMappingURL=Tooltip.cjs.map
