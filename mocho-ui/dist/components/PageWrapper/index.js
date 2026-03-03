import { jsx } from "@emotion/react/jsx-runtime";
import { Box, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ErrorBoundary } from "../ErrorBoundary/ErrorBoundary.js";
const LoaderWrapper = styled("div")(({
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
    content = /* @__PURE__ */ jsx(LoaderWrapper, { children: loadingComponent ?? /* @__PURE__ */ jsx(CircularProgress, { color: "primary" }) });
  } else if (isError) {
    content = /* @__PURE__ */ jsx(LoaderWrapper, { children: errorComponent ?? /* @__PURE__ */ jsx("div", { children: "Something went wrong." }) });
  } else if (isEmpty) {
    content = /* @__PURE__ */ jsx(LoaderWrapper, { children: emptyComponent ?? /* @__PURE__ */ jsx("div", { children: "No data found." }) });
  } else {
    content = /* @__PURE__ */ jsx(Box, { sx: mergedSx, ...boxProps, children });
  }
  return /* @__PURE__ */ jsx(ErrorBoundary, { context: errorContext, onError: onBoundaryError, fallback: () => /* @__PURE__ */ jsx("div", { children: "This page failed to load. Please try refreshing the page." }), children: content });
};
export {
  PageWrapper,
  PageWrapper as default
};
//# sourceMappingURL=index.js.map
