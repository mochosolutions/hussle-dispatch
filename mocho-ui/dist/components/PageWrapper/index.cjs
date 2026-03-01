"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const ErrorBoundary = require("../ErrorBoundary/ErrorBoundary.cjs");
const styled = require("../../node_modules/@mui/material/styles/styled.cjs");
const LoaderWrapper = styled.default("div")(({
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
  ...boxProps
}) => {
  let content;
  if (isLoading) {
    content = /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(LoaderWrapper, { children: loadingComponent ?? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.CircularProgress, { color: "primary" }) });
  } else if (isError) {
    content = /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(LoaderWrapper, { children: errorComponent ?? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("div", { children: "Something went wrong." }) });
  } else if (isEmpty) {
    content = /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(LoaderWrapper, { children: emptyComponent ?? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("div", { children: "No data found." }) });
  } else {
    content = /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { sx: {
      height: "100%",
      flex: 1,
      display: "flex",
      flexDirection: "column"
    }, ...boxProps, children });
  }
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ErrorBoundary.ErrorBoundary, { context: errorContext, onError: onBoundaryError, fallback: () => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("div", { children: "This page failed to load. Please try refreshing the page." }), children: content });
};
exports.PageWrapper = PageWrapper;
exports.default = PageWrapper;
//# sourceMappingURL=index.cjs.map
