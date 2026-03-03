import { jsx, jsxs } from "@emotion/react/jsx-runtime";
import { Outlet } from "react-router-dom";
import MainDrawer from "./Drawer/index.js";
import Header from "./Header/index.js";
import Footer from "./Footer.js";
import MainContent from "./MainContent.js";
import LayoutShell from "./LayoutShell.js";
import Profile from "./Header/HeaderContent/Profile/index.js";
import { LayoutStateProvider } from "../../../contexts/LayoutStateContext.js";
const MainLayout = ({
  menuItems,
  user,
  onLogout,
  logo,
  logoIcon,
  headerContent,
  footerContent
}) => {
  const defaultHeaderContent = /* @__PURE__ */ jsx("div", { style: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto"
  }, children: /* @__PURE__ */ jsx(Profile, { user, onLogout }) });
  return /* @__PURE__ */ jsx(LayoutStateProvider, { children: /* @__PURE__ */ jsxs(LayoutShell, { children: [
    /* @__PURE__ */ jsx(Header, { children: headerContent ?? defaultHeaderContent }),
    /* @__PURE__ */ jsx(MainDrawer, { menuItems, logo, logoIcon }),
    /* @__PURE__ */ jsxs(MainContent, { children: [
      /* @__PURE__ */ jsx(Outlet, {}),
      /* @__PURE__ */ jsx(Footer, { children: footerContent })
    ] })
  ] }) });
};
export {
  MainLayout as default
};
//# sourceMappingURL=index.js.map
