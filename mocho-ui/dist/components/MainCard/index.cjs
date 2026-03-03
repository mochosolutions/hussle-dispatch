"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const headerSX = {
  p: 2.5,
  "& .MuiCardHeader-action": {
    m: "0px auto",
    alignSelf: "center"
  }
};
const MainCard = React.forwardRef(({
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
  const theme = styles.useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const computedBoxShadow = isDarkMode ? boxShadow ?? true : boxShadow;
  const customShadow = shadow || (theme.customShadows?.z1 ?? theme.shadows[1]);
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Card, { elevation: elevation ?? 0, ref, ...others, sx: {
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
    !darkTitle && title && /* @__PURE__ */ jsxRuntime.jsx(material.CardHeader, { sx: headerSX, titleTypographyProps: {
      variant: "subtitle1"
    }, title, action: secondary, subheader }),
    darkTitle && title && /* @__PURE__ */ jsxRuntime.jsx(material.CardHeader, { sx: headerSX, title: /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h4", children: title }), action: secondary }),
    title && divider && /* @__PURE__ */ jsxRuntime.jsx(material.Divider, {}),
    content && /* @__PURE__ */ jsxRuntime.jsx(material.CardContent, { sx: contentSX, children }),
    !content && children
  ] });
});
MainCard.displayName = "MainCard";
module.exports = MainCard;
//# sourceMappingURL=index.cjs.map
