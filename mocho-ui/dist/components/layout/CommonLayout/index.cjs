"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const reactRouterDom = require("react-router-dom");
const Loader = require("../../Loadable/Loader.cjs");
const _interopNamespaceDefaultOnly = (e) => Object.freeze(Object.defineProperty({ __proto__: null, default: e }, Symbol.toStringTag, { value: "Module" }));
const Header = React.lazy(() => Promise.resolve().then(() => /* @__PURE__ */ _interopNamespaceDefaultOnly(require("./Header.cjs"))));
const FooterBlock = React.lazy(() => Promise.resolve().then(() => /* @__PURE__ */ _interopNamespaceDefaultOnly(require("./FooterBlock.cjs"))));
const CommonLayout = ({
  layout = "blank"
}) => /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
  (layout === "landing" || layout === "simple") && /* @__PURE__ */ jsxRuntime.jsxs(React.Suspense, { fallback: /* @__PURE__ */ jsxRuntime.jsx(Loader, {}), children: [
    /* @__PURE__ */ jsxRuntime.jsx(Header, { layout }),
    /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Outlet, {}),
    /* @__PURE__ */ jsxRuntime.jsx(FooterBlock, { isFull: layout === "landing" })
  ] }),
  layout === "blank" && /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Outlet, {})
] });
module.exports = CommonLayout;
//# sourceMappingURL=index.cjs.map
