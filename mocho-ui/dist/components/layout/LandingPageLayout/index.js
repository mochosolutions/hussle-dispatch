import { jsx, jsxs } from "../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { lazy, Suspense } from "react";
import styled from "styled-components";
import { Outlet } from "react-router-dom";
import Loader from "../../Loadable/Loader.js";
const Header = lazy(() => import("./Header.js"));
const FooterBlock = lazy(() => import("./FooterBlock.js"));
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
  return /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(Loader, {}), children: /* @__PURE__ */ jsxs(PageContainer, { children: [
    /* @__PURE__ */ jsx(HeaderContainer, { children: /* @__PURE__ */ jsx(Header, {}) }),
    /* @__PURE__ */ jsx(MainContainer, { children: /* @__PURE__ */ jsx(Outlet, {}) }),
    /* @__PURE__ */ jsx(FooterContainer, { children: /* @__PURE__ */ jsx(FooterBlock, { isFull: true }) })
  ] }) });
}
export {
  FooterContainer,
  HeaderContainer,
  MainContainer,
  PageContainer,
  SimpleLayout as default
};
//# sourceMappingURL=index.js.map
