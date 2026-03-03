"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
function ListSkeleton({
  rows = 5,
  showHeader = true,
  showActions = true,
  rowHeight = 60,
  rowSpacing = 1
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { sx: {
    width: "100%",
    padding: 2
  }, role: "status", "aria-live": "polite", "aria-label": "Loading list data", children: [
    showHeader && /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { sx: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 3
    }, children: [
      /* @__PURE__ */ jsxRuntime.jsx(material.Skeleton, { variant: "text", width: 200, height: 40 }),
      showActions && /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { sx: {
        display: "flex",
        gap: 2
      }, children: [
        /* @__PURE__ */ jsxRuntime.jsx(material.Skeleton, { variant: "rectangular", width: 120, height: 36, sx: {
          borderRadius: 1
        } }),
        /* @__PURE__ */ jsxRuntime.jsx(material.Skeleton, { variant: "rectangular", width: 100, height: 36, sx: {
          borderRadius: 1
        } })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(material.Skeleton, { variant: "rectangular", width: "100%", height: 50, sx: {
      borderRadius: 1,
      mb: rowSpacing
    } }),
    /* @__PURE__ */ jsxRuntime.jsx(material.Stack, { spacing: rowSpacing, children: Array.from({
      length: rows
    }).map((_, index) => /* @__PURE__ */ jsxRuntime.jsx(material.Skeleton, { variant: "rectangular", width: "100%", height: rowHeight, sx: {
      borderRadius: 1
    } }, index)) }),
    /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: {
      display: "flex",
      justifyContent: "flex-end",
      mt: 2
    }, children: /* @__PURE__ */ jsxRuntime.jsx(material.Skeleton, { variant: "rectangular", width: 300, height: 40, sx: {
      borderRadius: 1
    } }) })
  ] });
}
exports.ListSkeleton = ListSkeleton;
exports.default = ListSkeleton;
//# sourceMappingURL=ListSkeleton.cjs.map
