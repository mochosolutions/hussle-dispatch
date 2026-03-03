"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const styles = require("@mui/material/styles");
const LinearProgress = require("@mui/material/LinearProgress");
const LoaderWrapper = styles.styled("div")(({
  theme
}) => ({
  position: "fixed",
  top: 0,
  left: 0,
  zIndex: 2001,
  width: "100%",
  "& > * + *": {
    marginTop: theme.spacing(2)
  }
}));
const Loader = () => /* @__PURE__ */ jsxRuntime.jsx(LoaderWrapper, { children: /* @__PURE__ */ jsxRuntime.jsx(LinearProgress, { color: "primary" }) });
module.exports = Loader;
//# sourceMappingURL=Loader.cjs.map
