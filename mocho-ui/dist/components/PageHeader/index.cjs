"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const ArrowBackIcon = require("@mui/icons-material/ArrowBack");
const PageHeader = ({
  showBackButton = false,
  onNavigate,
  title,
  subtitle,
  headerActions
}) => {
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", mb: 1, children: [
    /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { display: "flex", alignItems: "center", gap: 2, children: [
      showBackButton && onNavigate && /* @__PURE__ */ jsxRuntime.jsx(material.IconButton, { size: "large", edge: "start", color: "inherit", onClick: onNavigate, children: /* @__PURE__ */ jsxRuntime.jsx(ArrowBackIcon, {}) }),
      /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { children: [
        title && /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h3", component: "h1", children: title }),
        subtitle && /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "subtitle1", color: "text.secondary", children: subtitle })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(material.Box, { children: headerActions && /* @__PURE__ */ jsxRuntime.jsx(material.Box, { children: headerActions }) })
  ] });
};
exports.PageHeader = PageHeader;
exports.default = PageHeader;
//# sourceMappingURL=index.cjs.map
