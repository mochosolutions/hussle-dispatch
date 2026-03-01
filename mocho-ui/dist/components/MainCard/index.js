import { jsxs, jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { forwardRef } from "react";
import { Card, CardHeader, Typography, Divider, CardContent } from "@mui/material";
import useTheme from "../../node_modules/@mui/material/styles/useTheme.js";
const headerSX = {
  p: 2.5,
  "& .MuiCardHeader-action": {
    m: "0px auto",
    alignSelf: "center"
  }
};
const MainCard = forwardRef(({
  border = true,
  boxShadow,
  children,
  subheader,
  content = true,
  contentSX = {},
  darkTitle,
  divider = true,
  elevation,
  secondary,
  shadow,
  sx = {},
  title,
  modal = false,
  ...others
}, ref) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const computedBoxShadow = isDarkMode ? boxShadow ?? true : boxShadow;
  const customShadow = shadow || (theme.customShadows?.z1 ?? theme.shadows[1]);
  return /* @__PURE__ */ jsxs(Card, { elevation: elevation ?? 0, ref, ...others, sx: {
    display: "flex",
    flexDirection: "column",
    marginTop: 1,
    marginBottom: 1,
    position: "relative",
    border: border ? "1px solid" : "none",
    borderRadius: 1,
    borderColor: isDarkMode ? theme.palette.divider : theme.palette.grey[300],
    boxShadow: computedBoxShadow && (!border || isDarkMode) ? customShadow : "inherit",
    ":hover": {
      boxShadow: computedBoxShadow ? customShadow : "inherit"
    },
    ...modal && {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: {
        xs: `calc( 100% - 50px)`,
        sm: "auto"
      },
      "& .MuiCardContent-root": {
        overflowY: "auto",
        minHeight: "auto",
        maxHeight: `calc(100vh - 200px)`
      }
    },
    ...sx
  }, children: [
    !darkTitle && title && /* @__PURE__ */ jsx(CardHeader, { sx: headerSX, titleTypographyProps: {
      variant: "subtitle1"
    }, title, action: secondary, subheader }),
    darkTitle && title && /* @__PURE__ */ jsx(CardHeader, { sx: headerSX, title: /* @__PURE__ */ jsx(Typography, { variant: "h4", children: title }), action: secondary }),
    title && divider && /* @__PURE__ */ jsx(Divider, {}),
    content && /* @__PURE__ */ jsx(CardContent, { sx: contentSX, children }),
    !content && children
  ] });
});
MainCard.displayName = "MainCard";
export {
  MainCard as default
};
//# sourceMappingURL=index.js.map
