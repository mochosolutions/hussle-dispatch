import { jsxs, jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { Typography, Grid, Divider } from "@mui/material";
import MainCard from "../MainCard/index.js";
import { HomeOutlined, HomeFilled } from "@ant-design/icons";
import useTheme from "../../node_modules/@mui/material/styles/useTheme.js";
import Breadcrumbs$1 from "../../node_modules/@mui/material/Breadcrumbs/Breadcrumbs.js";
const Breadcrumbs = ({
  items = [],
  card = true,
  divider = true,
  icon = false,
  icons = false,
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
  const separatorIcon = separator ? /* @__PURE__ */ jsx(SeparatorIcon, { style: {
    fontSize: "0.75rem",
    marginTop: 2
  } }) : "/";
  const activeItem = items.find((item) => item.active) || items[items.length - 1];
  const pageTitle = activeItem?.title || "";
  const homeContent = /* @__PURE__ */ jsxs(Typography, { component: LinkComponent, href: homeUrl, to: homeUrl, color: "textSecondary", variant: "h6", sx: {
    textDecoration: "none",
    cursor: "pointer"
  }, children: [
    icons && /* @__PURE__ */ jsx(HomeOutlined, { style: iconSX }),
    icon && !icons && /* @__PURE__ */ jsx(HomeFilled, { style: {
      ...iconSX,
      marginRight: 0
    } }),
    (!icon || icons) && "Home"
  ] });
  const breadcrumbItems = items.map((item, index) => {
    const isActive = item.active !== void 0 ? item.active : index === items.length - 1;
    const ItemIcon = item.icon;
    if (isActive) {
      return /* @__PURE__ */ jsxs(Typography, { variant: "subtitle1", color: "textPrimary", children: [
        icons && ItemIcon && /* @__PURE__ */ jsx(ItemIcon, { style: iconSX }),
        item.title
      ] }, index);
    }
    return /* @__PURE__ */ jsxs(Typography, { component: item.url ? LinkComponent : "span", href: item.url, to: item.url, variant: "h6", sx: {
      textDecoration: "none",
      cursor: item.url ? "pointer" : "default"
    }, color: "textSecondary", children: [
      icons && ItemIcon && /* @__PURE__ */ jsx(ItemIcon, { style: iconSX }),
      item.title
    ] }, index);
  });
  return /* @__PURE__ */ jsxs(MainCard, { border: card, sx: card === false ? {
    mb: 3,
    bgcolor: "transparent",
    ...sx
  } : {
    mb: 3,
    ...sx
  }, ...others, content: card, shadow: "none", children: [
    /* @__PURE__ */ jsxs(Grid, { container: true, direction: rightAlign ? "row" : "column", justifyContent: rightAlign ? "space-between" : "flex-start", alignItems: rightAlign ? "center" : "flex-start", spacing: 1, children: [
      title && !titleBottom && /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(Typography, { variant: "h2", children: pageTitle }) }),
      /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsxs(Breadcrumbs$1, { "aria-label": "breadcrumb", maxItems, separator: separatorIcon, children: [
        homeContent,
        breadcrumbItems
      ] }) }),
      title && titleBottom && /* @__PURE__ */ jsx(Grid, { item: true, sx: {
        mt: card === false ? 0.25 : 1
      }, children: /* @__PURE__ */ jsx(Typography, { variant: "h2", children: pageTitle }) })
    ] }),
    card === false && divider !== false && /* @__PURE__ */ jsx(Divider, { sx: {
      mt: 2
    } })
  ] });
};
export {
  Breadcrumbs as default
};
//# sourceMappingURL=Breadcrumbs.js.map
