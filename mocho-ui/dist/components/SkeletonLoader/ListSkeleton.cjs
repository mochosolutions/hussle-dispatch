"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
function ListSkeleton({
  rows = 5,
  showHeader = true,
  showActions = true,
  rowHeight = 60,
  rowSpacing = 1
}) {
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { sx: {
    width: "100%",
    padding: 2
  }, role: "status", "aria-live": "polite", "aria-label": "Loading list data", children: [
    showHeader && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { sx: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 3
    }, children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Skeleton, { variant: "text", width: 200, height: 40 }),
      showActions && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { sx: {
        display: "flex",
        gap: 2
      }, children: [
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Skeleton, { variant: "rectangular", width: 120, height: 36, sx: {
          borderRadius: 1
        } }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Skeleton, { variant: "rectangular", width: 100, height: 36, sx: {
          borderRadius: 1
        } })
      ] })
    ] }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Skeleton, { variant: "rectangular", width: "100%", height: 50, sx: {
      borderRadius: 1,
      mb: rowSpacing
    } }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Stack, { spacing: rowSpacing, children: Array.from({
      length: rows
    }).map((_, index) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Skeleton, { variant: "rectangular", width: "100%", height: rowHeight, sx: {
      borderRadius: 1
    } }, index)) }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { sx: {
      display: "flex",
      justifyContent: "flex-end",
      mt: 2
    }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Skeleton, { variant: "rectangular", width: 300, height: 40, sx: {
      borderRadius: 1
    } }) })
  ] });
}
exports.ListSkeleton = ListSkeleton;
exports.default = ListSkeleton;
//# sourceMappingURL=ListSkeleton.cjs.map
