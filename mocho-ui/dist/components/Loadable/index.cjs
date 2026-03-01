"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const Loader = require("./Loader.cjs");
const Loadable = (Component) => (props) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(React.Suspense, { fallback: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Loader, {}), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Component, { ...props }) });
module.exports = Loadable;
//# sourceMappingURL=index.cjs.map
