"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const ArrowBack = require("../../_virtual/ArrowBack.cjs");
const PageHeader = ({
  showBackButton = false,
  onNavigate,
  title,
  subtitle,
  headerActions
}) => {
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", mb: 1, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { display: "flex", alignItems: "center", gap: 2, children: [
      showBackButton && onNavigate && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.IconButton, { size: "large", edge: "start", color: "inherit", onClick: onNavigate, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ArrowBack, {}) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { children: [
        title && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h3", component: "h1", children: title }),
        subtitle && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "subtitle1", color: "text.secondary", children: subtitle })
      ] })
    ] }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { children: headerActions && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { children: headerActions }) })
  ] });
};
exports.PageHeader = PageHeader;
exports.default = PageHeader;
//# sourceMappingURL=index.cjs.map
