"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const CircularProgress = require("../../node_modules/@mui/material/CircularProgress/CircularProgress.cjs");
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
const PageLoader = ({
  open,
  children
}) => {
  if (open) {
    return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(LoaderWrapper, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(CircularProgress, { color: "primary" }) });
  }
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(emotionReactJsxRuntime_browser_esm.Fragment, { children });
};
exports.PageLoader = PageLoader;
exports.default = PageLoader;
//# sourceMappingURL=index.cjs.map
