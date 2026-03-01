"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const material = require("@mui/material");
const index$2 = require("./DrawerHeader/index.cjs");
const index$1 = require("./DrawerContent/index.cjs");
const MiniDrawerStyled = require("./MiniDrawerStyled.cjs");
const config = require("../../../../config.cjs");
const index = require("../../../../store/index.cjs");
const menu = require("../../../../store/reducers/menu.cjs");
const useTheme = require("../../../../node_modules/@mui/material/styles/useTheme.cjs");
const MainDrawer = ({
  window
}) => {
  const theme = useTheme();
  const dispatch = index.useDispatch();
  const matchDownMD = material.useMediaQuery(theme.breakpoints.down("lg"));
  const menu$1 = index.useSelector((state) => state.menu);
  const {
    drawerOpen
  } = menu$1;
  console.log("Drawer render", drawerOpen);
  const container = window !== void 0 ? () => window().document.body : void 0;
  const drawerContent = React.useMemo(() => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index$1, {}), []);
  const drawerHeader = React.useMemo(() => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index$2, { open: drawerOpen }), [drawerOpen]);
  if (!matchDownMD) {
    return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { component: "nav", sx: {
      flexShrink: {
        md: 0
      },
      zIndex: 1200
    }, "aria-label": "mailbox folders", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(MiniDrawerStyled, { variant: "permanent", open: drawerOpen, children: [
      drawerHeader,
      drawerContent
    ] }) });
  }
  console.log("Rendering mobile drawer, open:", drawerOpen);
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Drawer, { container, variant: "temporary", open: drawerOpen, onClose: () => {
    dispatch(menu.openDrawer(false));
  }, ModalProps: {
    keepMounted: true,
    slotProps: {
      backdrop: {
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)"
        }
      }
    }
  }, sx: {
    display: {
      xs: "block",
      lg: "none"
    },
    "& .MuiDrawer-paper": {
      boxSizing: "border-box",
      width: config.DRAWER_WIDTH,
      borderRight: `1px solid ${theme.palette.divider}`,
      backgroundImage: "none",
      boxShadow: "inherit"
    }
  }, children: [
    drawerHeader,
    drawerContent
  ] });
};
module.exports = MainDrawer;
//# sourceMappingURL=index.cjs.map
