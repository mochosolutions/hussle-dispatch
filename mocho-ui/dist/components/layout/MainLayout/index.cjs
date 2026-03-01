"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const reactRouterDom = require("react-router-dom");
const material = require("@mui/material");
const index$2 = require("./Drawer/index.cjs");
const index$1 = require("./Header/index.cjs");
const Footer = require("./Footer.cjs");
const useConfig = require("../../../hooks/useConfig.cjs");
const index = require("../../../store/index.cjs");
const menu = require("../../../store/reducers/menu.cjs");
const config = require("../../../types/config.cjs");
const Loader = require("../../Loadable/Loader.cjs");
const LayoutContext = require("../LayoutContext.cjs");
const useTheme = require("../../../node_modules/@mui/material/styles/useTheme.cjs");
const MainLayout = () => {
  const theme = useTheme();
  const dispatch = index.useDispatch();
  const matchDownXL = material.useMediaQuery(theme.breakpoints.down("xl"));
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    container,
    miniDrawer,
    menuOrientation
  } = useConfig.useConfig();
  const menu$1 = index.useSelector((state) => state.menu);
  const {
    drawerOpen
  } = menu$1;
  const {
    isLoading,
    loadingMessage
  } = LayoutContext.useLayout();
  const isHorizontal = menuOrientation === config.MenuOrientation.HORIZONTAL && !downLG;
  React.useEffect(() => {
    if (!miniDrawer) {
      dispatch(menu.openDrawer(!matchDownXL));
    }
  }, []);
  React.useEffect(() => {
    if (!miniDrawer) {
      dispatch(menu.openDrawer(!matchDownXL));
    }
  }, [matchDownXL]);
  if (isLoading) {
    return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs("div", { children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Loader, {}),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h6", sx: {
        textAlign: "center",
        mt: 2
      }, children: loadingMessage || "Loading, please wait..." })
    ] });
  }
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { sx: {
    display: "flex",
    width: "100%"
  }, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index$1, {}),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index$2, {}),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { component: "main", sx: {
      width: downLG ? "100%" : drawerOpen ? "calc(100% - 260px)" : "calc(100% - 60px)",
      flexGrow: 1,
      p: {
        xs: 2,
        sm: 3
      },
      // Disable pointer events on mobile when drawer is open to allow backdrop clicks
      ...downLG && drawerOpen && {
        pointerEvents: "none"
      },
      transition: theme.transitions.create(["width", "pointer-events"], {
        easing: theme.transitions.easing.sharp,
        duration: drawerOpen ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen
      })
    }, children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Toolbar, { sx: {
        mt: isHorizontal ? 8 : "inherit"
      } }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Container, { maxWidth: container ? "xl" : false, sx: {
        ...container && {
          px: {
            xs: 0,
            sm: 2
          }
        },
        position: "relative",
        minHeight: "calc(100vh - 110px)",
        display: "flex",
        flexDirection: "column"
      }, children: [
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(reactRouterDom.Outlet, {}),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Footer, {})
      ] })
    ] })
  ] });
};
module.exports = MainLayout;
//# sourceMappingURL=index.cjs.map
