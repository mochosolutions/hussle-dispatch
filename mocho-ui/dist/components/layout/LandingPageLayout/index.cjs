"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const styled = require("styled-components");
const reactRouterDom = require("react-router-dom");
const Loader = require("../../Loadable/Loader.cjs");
const _interopNamespaceDefaultOnly = (e) => Object.freeze(Object.defineProperty({ __proto__: null, default: e }, Symbol.toStringTag, { value: "Module" }));
const Header = React.lazy(() => Promise.resolve().then(() => /* @__PURE__ */ _interopNamespaceDefaultOnly(require("./Header.cjs"))));
const FooterBlock = React.lazy(() => Promise.resolve().then(() => /* @__PURE__ */ _interopNamespaceDefaultOnly(require("./FooterBlock.cjs"))));
const PageContainer = styled.div`
    display: grid;
    grid-template-rows: auto 1fr auto;
    justify-items: center;
    min-height: 100vh;
`;
const HeaderContainer = styled.header`
    display: flex;
    grid-row-start: 1;
    width: 100%;
    height: 80px;
`;
const MainContainer = styled.main`
    display: flex;
    flex-direction: column;
    grid-row-start: 2;  
    width: 100%;
    background-color: white;
`;
const FooterContainer = styled.footer`
    display: flex;
    flex-direction: column;
    grid-row-start: 3;
    width: 100%;
`;
function SimpleLayout() {
  return /* @__PURE__ */ jsxRuntime.jsx(React.Suspense, { fallback: /* @__PURE__ */ jsxRuntime.jsx(Loader, {}), children: /* @__PURE__ */ jsxRuntime.jsxs(PageContainer, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(HeaderContainer, { children: /* @__PURE__ */ jsxRuntime.jsx(Header, {}) }),
    /* @__PURE__ */ jsxRuntime.jsx(MainContainer, { children: /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Outlet, {}) }),
    /* @__PURE__ */ jsxRuntime.jsx(FooterContainer, { children: /* @__PURE__ */ jsxRuntime.jsx(FooterBlock, { isFull: true }) })
  ] }) });
}
exports.FooterContainer = FooterContainer;
exports.HeaderContainer = HeaderContainer;
exports.MainContainer = MainContainer;
exports.PageContainer = PageContainer;
exports.default = SimpleLayout;
//# sourceMappingURL=index.cjs.map
