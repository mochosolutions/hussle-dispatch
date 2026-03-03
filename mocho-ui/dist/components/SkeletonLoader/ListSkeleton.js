import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { Box, Skeleton, Stack } from "@mui/material";
function ListSkeleton({
  rows = 5,
  showHeader = true,
  showActions = true,
  rowHeight = 60,
  rowSpacing = 1
}) {
  return /* @__PURE__ */ jsxs(Box, { sx: {
    width: "100%",
    padding: 2
  }, role: "status", "aria-live": "polite", "aria-label": "Loading list data", children: [
    showHeader && /* @__PURE__ */ jsxs(Box, { sx: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 3
    }, children: [
      /* @__PURE__ */ jsx(Skeleton, { variant: "text", width: 200, height: 40 }),
      showActions && /* @__PURE__ */ jsxs(Box, { sx: {
        display: "flex",
        gap: 2
      }, children: [
        /* @__PURE__ */ jsx(Skeleton, { variant: "rectangular", width: 120, height: 36, sx: {
          borderRadius: 1
        } }),
        /* @__PURE__ */ jsx(Skeleton, { variant: "rectangular", width: 100, height: 36, sx: {
          borderRadius: 1
        } })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Skeleton, { variant: "rectangular", width: "100%", height: 50, sx: {
      borderRadius: 1,
      mb: rowSpacing
    } }),
    /* @__PURE__ */ jsx(Stack, { spacing: rowSpacing, children: Array.from({
      length: rows
    }).map((_, index) => /* @__PURE__ */ jsx(Skeleton, { variant: "rectangular", width: "100%", height: rowHeight, sx: {
      borderRadius: 1
    } }, index)) }),
    /* @__PURE__ */ jsx(Box, { sx: {
      display: "flex",
      justifyContent: "flex-end",
      mt: 2
    }, children: /* @__PURE__ */ jsx(Skeleton, { variant: "rectangular", width: 300, height: 40, sx: {
      borderRadius: 1
    } }) })
  ] });
}
export {
  ListSkeleton,
  ListSkeleton as default
};
//# sourceMappingURL=ListSkeleton.js.map
