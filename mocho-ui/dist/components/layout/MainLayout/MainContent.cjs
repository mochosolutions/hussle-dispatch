"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const useConfig = require("../../../hooks/useConfig.cjs");
const useLayoutState = require("../../../hooks/useLayoutState.cjs");
const config$1 = require("../../../config.cjs");
const config = require("../../../types/config.cjs");
const MainContent = ({
  children,
  drawerWidth = config$1.DRAWER_WIDTH,
  miniDrawerWidth = config$1.MINI_DRAWER_WIDTH,
  mobileBreakpoint = "lg",
  container: containerProp,
  contentPadding = {
    xs: 2,
    sm: 3
  },
  containerMaxWidth = "xl",
  showToolbarSpacer = true,
  sx: sxProp
}) => {
  const theme = styles.useTheme();
  const {
    container: configContainer,
    menuOrientation
  } = useConfig();
  const downBreakpoint = material.useMediaQuery(theme.breakpoints.down(mobileBreakpoint));
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    drawerOpen
  } = useLayoutState();
  const useContainer = containerProp ?? configContainer;
  const isHorizontal = menuOrientation === config.MenuOrientation.HORIZONTAL && !downLG;
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { component: "main", sx: {
    width: downBreakpoint ? "100%" : drawerOpen ? `calc(100% - ${drawerWidth}px)` : `calc(100% - ${miniDrawerWidth}px)`,
    flexGrow: 1,
    p: contentPadding,
    ...downBreakpoint && drawerOpen && {
      pointerEvents: "none"
    },
    transition: theme.transitions.create(["width", "pointer-events"], {
      easing: theme.transitions.easing.sharp,
      duration: drawerOpen ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen
    }),
    ...sxProp ?? {}
  }, children: [
    showToolbarSpacer && /* @__PURE__ */ jsxRuntime.jsx(material.Toolbar, { sx: {
      mt: isHorizontal ? 8 : "inherit"
    } }),
    /* @__PURE__ */ jsxRuntime.jsx(material.Container, { disableGutters: !useContainer, maxWidth: useContainer ? containerMaxWidth : false, sx: {
      ...useContainer && {
        px: {
          xs: 0,
          sm: 2
        }
      },
      position: "relative",
      minHeight: "calc(100vh - 110px)",
      display: "flex",
      flexDirection: "column"
    }, children })
  ] });
};
module.exports = MainContent;
//# sourceMappingURL=MainContent.cjs.map
