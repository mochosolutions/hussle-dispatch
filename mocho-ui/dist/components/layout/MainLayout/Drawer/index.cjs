"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const index$1 = require("./DrawerHeader/index.cjs");
const index = require("./DrawerContent/index.cjs");
const MiniDrawerStyled = require("./MiniDrawerStyled.cjs");
const config = require("../../../../config.cjs");
const useLayoutState = require("../../../../hooks/useLayoutState.cjs");
const MainDrawer = ({
  menuItems,
  logo,
  logoIcon,
  header,
  footer,
  window: windowProp,
  navStyles,
  paperStyles,
  mobilePaperStyles,
  headerStyles
}) => {
  const theme = styles.useTheme();
  const matchDownMD = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    drawerOpen,
    onDrawerClose
  } = useLayoutState();
  const container = windowProp !== void 0 ? () => windowProp().document.body : void 0;
  const drawerContent = React.useMemo(() => /* @__PURE__ */ jsxRuntime.jsx(index, { menuItems }), [menuItems]);
  const drawerHeader = React.useMemo(() => header ?? /* @__PURE__ */ jsxRuntime.jsx(index$1, { open: drawerOpen, logo, logoIcon, styles: headerStyles }), [drawerOpen, header, logo, logoIcon, headerStyles]);
  if (!matchDownMD) {
    return /* @__PURE__ */ jsxRuntime.jsx(material.Box, { component: "nav", sx: {
      flexShrink: {
        md: 0
      },
      zIndex: 1200,
      ...navStyles ?? {}
    }, "aria-label": "mailbox folders", children: /* @__PURE__ */ jsxRuntime.jsxs(MiniDrawerStyled, { variant: "permanent", open: drawerOpen, PaperProps: paperStyles ? {
      sx: paperStyles
    } : void 0, children: [
      drawerHeader,
      drawerContent,
      footer
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Drawer, { container, variant: "temporary", open: drawerOpen, onClose: onDrawerClose, ModalProps: {
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
    }
  }, PaperProps: {
    sx: {
      boxSizing: "border-box",
      width: config.DRAWER_WIDTH,
      borderRight: `1px solid ${theme.palette.divider}`,
      backgroundImage: "none",
      boxShadow: "inherit",
      ...paperStyles ?? {},
      ...mobilePaperStyles ?? {}
    }
  }, children: [
    drawerHeader,
    drawerContent,
    footer
  ] });
};
module.exports = MainDrawer;
//# sourceMappingURL=index.cjs.map
