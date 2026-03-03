"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const styles = require("@mui/material/styles");
const CircularProgress = require("@mui/material/CircularProgress");
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
const PageLoader = ({
  open,
  children
}) => {
  if (open) {
    return /* @__PURE__ */ jsxRuntime.jsx(LoaderWrapper, { children: /* @__PURE__ */ jsxRuntime.jsx(CircularProgress, { color: "primary" }) });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children });
};
exports.PageLoader = PageLoader;
exports.default = PageLoader;
//# sourceMappingURL=index.cjs.map
