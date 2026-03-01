import { jsxs, jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { Box, IconButton, Typography, Stack } from "@mui/material";
import ArrowBackIcon from "../../_virtual/ArrowBack.js";
const PageHeader = ({
  showBackButton = false,
  onNavigate,
  title,
  subtitle,
  headerActions
}) => {
  return /* @__PURE__ */ jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", mb: 1, children: [
    /* @__PURE__ */ jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [
      showBackButton && onNavigate && /* @__PURE__ */ jsx(IconButton, { size: "large", edge: "start", color: "inherit", onClick: onNavigate, children: /* @__PURE__ */ jsx(ArrowBackIcon, {}) }),
      /* @__PURE__ */ jsxs(Box, { children: [
        title && /* @__PURE__ */ jsx(Typography, { variant: "h3", component: "h1", children: title }),
        subtitle && /* @__PURE__ */ jsx(Typography, { variant: "subtitle1", color: "text.secondary", children: subtitle })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Box, { children: headerActions && /* @__PURE__ */ jsx(Box, { children: headerActions }) })
  ] });
};
export {
  PageHeader,
  PageHeader as default
};
//# sourceMappingURL=index.js.map
