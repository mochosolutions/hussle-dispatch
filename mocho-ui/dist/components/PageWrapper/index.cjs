"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const styles = require("@mui/material/styles");
const ErrorBoundary = require("../ErrorBoundary/ErrorBoundary.cjs");
const LoaderWrapper = styles.styled("div")(({
  theme
}) => ({
  zIndex: 2001,
  width: "100%",
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& > * + *": {
    marginTop: theme.spacing(2)
  }
}));
const PageWrapper = ({
  children,
  // title,
  isLoading = false,
  loadingComponent,
  isEmpty,
  emptyComponent,
  errorComponent,
  isError,
  errorContext,
  onBoundaryError,
  sx,
  ...boxProps
}) => {
  const baseSx = {
    m: 0,
    p: 0,
    height: "100%",
    flex: 1,
    display: "flex",
    flexDirection: "column"
  };
  const mergedSx = Array.isArray(sx) ? [baseSx, ...sx] : sx === void 0 ? baseSx : [baseSx, sx];
  let content;
  if (isLoading) {
    content = /* @__PURE__ */ jsxRuntime.jsx(LoaderWrapper, { children: loadingComponent ?? /* @__PURE__ */ jsxRuntime.jsx(material.CircularProgress, { color: "primary" }) });
  } else if (isError) {
    content = /* @__PURE__ */ jsxRuntime.jsx(LoaderWrapper, { children: errorComponent ?? /* @__PURE__ */ jsxRuntime.jsx("div", { children: "Something went wrong." }) });
  } else if (isEmpty) {
    content = /* @__PURE__ */ jsxRuntime.jsx(LoaderWrapper, { children: emptyComponent ?? /* @__PURE__ */ jsxRuntime.jsx("div", { children: "No data found." }) });
  } else {
    content = /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: mergedSx, ...boxProps, children });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(ErrorBoundary.ErrorBoundary, { context: errorContext, onError: onBoundaryError, fallback: () => /* @__PURE__ */ jsxRuntime.jsx("div", { children: "This page failed to load. Please try refreshing the page." }), children: content });
};
exports.PageWrapper = PageWrapper;
exports.default = PageWrapper;
//# sourceMappingURL=index.cjs.map
