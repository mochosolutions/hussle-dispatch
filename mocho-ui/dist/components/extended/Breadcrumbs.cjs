"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const index = require("../MainCard/index.cjs");
const icons = require("@ant-design/icons");
const useTheme = require("../../node_modules/@mui/material/styles/useTheme.cjs");
const Breadcrumbs$1 = require("../../node_modules/@mui/material/Breadcrumbs/Breadcrumbs.cjs");
const Breadcrumbs = ({
  items = [],
  card = true,
  divider = true,
  icon = false,
  icons: icons$1 = false,
  maxItems = 8,
  rightAlign = false,
  separator,
  title = false,
  titleBottom = false,
  sx,
  LinkComponent = "a",
  homeUrl = "/",
  ...others
}) => {
  const theme = useTheme();
  const iconSX = {
    marginRight: theme.spacing(0.75),
    marginTop: `-${theme.spacing(0.25)}`,
    width: "1rem",
    height: "1rem",
    color: theme.palette.secondary.main
  };
  const SeparatorIcon = separator;
  const separatorIcon = separator ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(SeparatorIcon, { style: {
    fontSize: "0.75rem",
    marginTop: 2
  } }) : "/";
  const activeItem = items.find((item) => item.active) || items[items.length - 1];
  const pageTitle = activeItem?.title || "";
  const homeContent = /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Typography, { component: LinkComponent, href: homeUrl, to: homeUrl, color: "textSecondary", variant: "h6", sx: {
    textDecoration: "none",
    cursor: "pointer"
  }, children: [
    icons$1 && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.HomeOutlined, { style: iconSX }),
    icon && !icons$1 && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.HomeFilled, { style: {
      ...iconSX,
      marginRight: 0
    } }),
    (!icon || icons$1) && "Home"
  ] });
  const breadcrumbItems = items.map((item, index2) => {
    const isActive = item.active !== void 0 ? item.active : index2 === items.length - 1;
    const ItemIcon = item.icon;
    if (isActive) {
      return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Typography, { variant: "subtitle1", color: "textPrimary", children: [
        icons$1 && ItemIcon && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ItemIcon, { style: iconSX }),
        item.title
      ] }, index2);
    }
    return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Typography, { component: item.url ? LinkComponent : "span", href: item.url, to: item.url, variant: "h6", sx: {
      textDecoration: "none",
      cursor: item.url ? "pointer" : "default"
    }, color: "textSecondary", children: [
      icons$1 && ItemIcon && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ItemIcon, { style: iconSX }),
      item.title
    ] }, index2);
  });
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(index, { border: card, sx: card === false ? {
    mb: 3,
    bgcolor: "transparent",
    ...sx
  } : {
    mb: 3,
    ...sx
  }, ...others, content: card, shadow: "none", children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Grid, { container: true, direction: rightAlign ? "row" : "column", justifyContent: rightAlign ? "space-between" : "flex-start", alignItems: rightAlign ? "center" : "flex-start", spacing: 1, children: [
      title && !titleBottom && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Grid, { item: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h2", children: pageTitle }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Grid, { item: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Breadcrumbs$1, { "aria-label": "breadcrumb", maxItems, separator: separatorIcon, children: [
        homeContent,
        breadcrumbItems
      ] }) }),
      title && titleBottom && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Grid, { item: true, sx: {
        mt: card === false ? 0.25 : 1
      }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h2", children: pageTitle }) })
    ] }),
    card === false && divider !== false && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Divider, { sx: {
      mt: 2
    } })
  ] });
};
module.exports = Breadcrumbs;
//# sourceMappingURL=Breadcrumbs.cjs.map
