import { jsx } from "@emotion/react/jsx-runtime";
import { useTheme, styled } from "@mui/material/styles";
import { Box, Tooltip, tooltipClasses } from "@mui/material";
import getColors from "../../utils/getColors.js";
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
      [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: main,
        color: labelColor ? labelColor : contrastText
      },
      [`& .${tooltipClasses.arrow}`]: {
        color: main
      }
    };
  } else {
    return {
      [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: colorValue,
        color: labelColor ? labelColor : contrastText,
        boxShadow: theme.shadows[1]
      },
      [`& .${tooltipClasses.arrow}`]: {
        color: colorValue
      }
    };
  }
}
const TooltipStyle = styled(({
  className,
  ...props
}) => /* @__PURE__ */ jsx(Tooltip, { ...props, classes: {
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
  return /* @__PURE__ */ jsx(Box, { display: "flex", children: /* @__PURE__ */ jsx(TooltipStyle, { arrow, ...rest, theme, labelColor, children }) });
}
export {
  CustomTooltip as default
};
//# sourceMappingURL=Tooltip.js.map
