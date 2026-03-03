"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const reactRouterDom = require("react-router-dom");
const index$1 = require("./Drawer/index.cjs");
const index = require("./Header/index.cjs");
const Footer = require("./Footer.cjs");
const MainContent = require("./MainContent.cjs");
const LayoutShell = require("./LayoutShell.cjs");
const index$2 = require("./Header/HeaderContent/Profile/index.cjs");
const LayoutStateContext = require("../../../contexts/LayoutStateContext.cjs");
const MainLayout = ({
  menuItems,
  user,
  onLogout,
  logo,
  logoIcon,
  headerContent,
  footerContent
}) => {
  const defaultHeaderContent = /* @__PURE__ */ jsxRuntime.jsx("div", { style: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto"
  }, children: /* @__PURE__ */ jsxRuntime.jsx(index$2, { user, onLogout }) });
  return /* @__PURE__ */ jsxRuntime.jsx(LayoutStateContext.LayoutStateProvider, { children: /* @__PURE__ */ jsxRuntime.jsxs(LayoutShell, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(index, { children: headerContent ?? defaultHeaderContent }),
    /* @__PURE__ */ jsxRuntime.jsx(index$1, { menuItems, logo, logoIcon }),
    /* @__PURE__ */ jsxRuntime.jsxs(MainContent, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Outlet, {}),
      /* @__PURE__ */ jsxRuntime.jsx(Footer, { children: footerContent })
    ] })
  ] }) });
};
module.exports = MainLayout;
//# sourceMappingURL=index.cjs.map
