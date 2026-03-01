import { jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import getColors from "../../utils/getColors.js";
import useTheme from "../../node_modules/@mui/material/styles/useTheme.js";
import styled from "../../node_modules/@mui/material/styles/styled.js";
import Avatar$1 from "../../node_modules/@mui/material/Avatar/Avatar.js";
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
const AvatarStyle = styled(Avatar$1, {
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
  const theme = useTheme();
  return /* @__PURE__ */ jsx(AvatarStyle, { variant, theme, color, ...others, children });
}
export {
  Avatar as default
};
//# sourceMappingURL=Avatar.js.map
