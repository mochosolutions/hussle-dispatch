import { jsxs, jsx, Fragment } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { Skeleton, Box, Stack, Divider } from "@mui/material";
function FormSkeleton({
  fields = 5,
  showBackButton = true,
  showTitle = true,
  showActions = true,
  showRichEditor = false,
  fieldSpacing = 3,
  showCard = true
}) {
  const content = /* @__PURE__ */ jsxs(Box, { sx: {
    width: "100%",
    padding: showCard ? 3 : 0
  }, role: "status", "aria-live": "polite", "aria-label": "Loading form", children: [
    showBackButton && /* @__PURE__ */ jsx(Box, { sx: {
      mb: 2
    }, children: /* @__PURE__ */ jsx(Skeleton, { variant: "rectangular", width: 100, height: 36, sx: {
      borderRadius: 1
    } }) }),
    showTitle && /* @__PURE__ */ jsx(Box, { sx: {
      mb: 3
    }, children: /* @__PURE__ */ jsx(Skeleton, { variant: "text", width: "40%", height: 40 }) }),
    /* @__PURE__ */ jsxs(Stack, { spacing: fieldSpacing, children: [
      Array.from({
        length: fields
      }).map((_, index) => /* @__PURE__ */ jsxs(Box, { children: [
        /* @__PURE__ */ jsx(Skeleton, { variant: "text", width: 120, height: 24, sx: {
          mb: 1
        } }),
        /* @__PURE__ */ jsx(Skeleton, { variant: "rectangular", width: "100%", height: index % 3 === 0 ? 56 : index % 3 === 1 ? 100 : 56, sx: {
          borderRadius: 1
        } })
      ] }, index)),
      showRichEditor && /* @__PURE__ */ jsxs(Box, { children: [
        /* @__PURE__ */ jsx(Skeleton, { variant: "text", width: 150, height: 24, sx: {
          mb: 1
        } }),
        /* @__PURE__ */ jsx(Skeleton, { variant: "rectangular", width: "100%", height: 48, sx: {
          borderRadius: "4px 4px 0 0",
          mb: 0.5
        } }),
        /* @__PURE__ */ jsx(Skeleton, { variant: "rectangular", width: "100%", height: 200, sx: {
          borderRadius: "0 0 4px 4px"
        } })
      ] })
    ] }),
    showActions && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Divider, { sx: {
        my: 3
      } }),
      /* @__PURE__ */ jsxs(Box, { sx: {
        display: "flex",
        gap: 2,
        justifyContent: "flex-end"
      }, children: [
        /* @__PURE__ */ jsx(Skeleton, { variant: "rectangular", width: 100, height: 40, sx: {
          borderRadius: 1
        } }),
        /* @__PURE__ */ jsx(Skeleton, { variant: "rectangular", width: 120, height: 40, sx: {
          borderRadius: 1
        } })
      ] })
    ] })
  ] });
  if (!showCard) {
    return content;
  }
  return /* @__PURE__ */ jsx(Box, { sx: {
    backgroundColor: "background.paper",
    borderRadius: 1,
    boxShadow: 1
  }, children: content });
}
export {
  FormSkeleton,
  FormSkeleton as default
};
//# sourceMappingURL=FormSkeleton.js.map
