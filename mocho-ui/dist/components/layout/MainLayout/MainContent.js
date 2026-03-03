import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery, Box, Toolbar, Container } from "@mui/material";
import useConfig from "../../../hooks/useConfig.js";
import useLayoutState from "../../../hooks/useLayoutState.js";
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from "../../../config.js";
import { MenuOrientation } from "../../../types/config.js";
const MainContent = ({
  children,
  drawerWidth = DRAWER_WIDTH,
  miniDrawerWidth = MINI_DRAWER_WIDTH,
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
  const theme = useTheme();
  const {
    container: configContainer,
    menuOrientation
  } = useConfig();
  const downBreakpoint = useMediaQuery(theme.breakpoints.down(mobileBreakpoint));
  const downLG = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    drawerOpen
  } = useLayoutState();
  const useContainer = containerProp ?? configContainer;
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;
  return /* @__PURE__ */ jsxs(Box, { component: "main", sx: {
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
    showToolbarSpacer && /* @__PURE__ */ jsx(Toolbar, { sx: {
      mt: isHorizontal ? 8 : "inherit"
    } }),
    /* @__PURE__ */ jsx(Container, { disableGutters: !useContainer, maxWidth: useContainer ? containerMaxWidth : false, sx: {
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
export {
  MainContent as default
};
//# sourceMappingURL=MainContent.js.map
