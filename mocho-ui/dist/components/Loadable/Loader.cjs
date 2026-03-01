"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const LinearProgress = require("../../node_modules/@mui/material/LinearProgress/LinearProgress.cjs");
const styled = require("../../node_modules/@mui/material/styles/styled.cjs");
const LoaderWrapper = styled.default("div")(({
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
const Loader = () => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(LoaderWrapper, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(LinearProgress, { color: "primary" }) });
module.exports = Loader;
//# sourceMappingURL=Loader.cjs.map
