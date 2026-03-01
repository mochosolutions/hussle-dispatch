"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const reactRouterDom = require("react-router-dom");
const Loader = require("../../Loadable/Loader.cjs");
const _interopNamespaceDefaultOnly = (e) => Object.freeze(Object.defineProperty({ __proto__: null, default: e }, Symbol.toStringTag, { value: "Module" }));
const Header = React.lazy(() => Promise.resolve().then(() => /* @__PURE__ */ _interopNamespaceDefaultOnly(require("./Header.cjs"))));
const FooterBlock = React.lazy(() => Promise.resolve().then(() => /* @__PURE__ */ _interopNamespaceDefaultOnly(require("./FooterBlock.cjs"))));
const CommonLayout = ({
  layout = "blank"
}) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(emotionReactJsxRuntime_browser_esm.Fragment, { children: [
  (layout === "landing" || layout === "simple") && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(React.Suspense, { fallback: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Loader, {}), children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Header, { layout }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(reactRouterDom.Outlet, {}),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FooterBlock, { isFull: layout === "landing" })
  ] }),
  layout === "blank" && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(reactRouterDom.Outlet, {})
] });
module.exports = CommonLayout;
//# sourceMappingURL=index.cjs.map
