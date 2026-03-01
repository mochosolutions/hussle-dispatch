import { jsxs, jsx } from "../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useMediaQuery, Typography, Box, Toolbar, Container } from "@mui/material";
import MainDrawer from "./Drawer/index.js";
import Header from "./Header/index.js";
import Footer from "./Footer.js";
import { useConfig } from "../../../hooks/useConfig.js";
import { useDispatch, useSelector } from "../../../store/index.js";
import { openDrawer } from "../../../store/reducers/menu.js";
import { MenuOrientation } from "../../../types/config.js";
import Loader from "../../Loadable/Loader.js";
import { useLayout } from "../LayoutContext.js";
import useTheme from "../../../node_modules/@mui/material/styles/useTheme.js";
const MainLayout = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownXL = useMediaQuery(theme.breakpoints.down("xl"));
  const downLG = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    container,
    miniDrawer,
    menuOrientation
  } = useConfig();
  const menu = useSelector((state) => state.menu);
  const {
    drawerOpen
  } = menu;
  const {
    isLoading,
    loadingMessage
  } = useLayout();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;
  useEffect(() => {
    if (!miniDrawer) {
      dispatch(openDrawer(!matchDownXL));
    }
  }, []);
  useEffect(() => {
    if (!miniDrawer) {
      dispatch(openDrawer(!matchDownXL));
    }
  }, [matchDownXL]);
  if (isLoading) {
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Loader, {}),
      /* @__PURE__ */ jsx(Typography, { variant: "h6", sx: {
        textAlign: "center",
        mt: 2
      }, children: loadingMessage || "Loading, please wait..." })
    ] });
  }
  return /* @__PURE__ */ jsxs(Box, { sx: {
    display: "flex",
    width: "100%"
  }, children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsx(MainDrawer, {}),
    /* @__PURE__ */ jsxs(Box, { component: "main", sx: {
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
      /* @__PURE__ */ jsx(Toolbar, { sx: {
        mt: isHorizontal ? 8 : "inherit"
      } }),
      /* @__PURE__ */ jsxs(Container, { maxWidth: container ? "xl" : false, sx: {
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
        /* @__PURE__ */ jsx(Outlet, {}),
        /* @__PURE__ */ jsx(Footer, {})
      ] })
    ] })
  ] });
};
export {
  MainLayout as default
};
//# sourceMappingURL=index.js.map
