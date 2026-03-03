import { jsx, jsxs } from "@emotion/react/jsx-runtime";
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery, Box, Drawer } from "@mui/material";
import DrawerHeader from "./DrawerHeader/index.js";
import DrawerContent from "./DrawerContent/index.js";
import MiniDrawerStyled from "./MiniDrawerStyled.js";
import { DRAWER_WIDTH } from "../../../../config.js";
import useLayoutState from "../../../../hooks/useLayoutState.js";
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
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    drawerOpen,
    onDrawerClose
  } = useLayoutState();
  const container = windowProp !== void 0 ? () => windowProp().document.body : void 0;
  const drawerContent = useMemo(() => /* @__PURE__ */ jsx(DrawerContent, { menuItems }), [menuItems]);
  const drawerHeader = useMemo(() => header ?? /* @__PURE__ */ jsx(DrawerHeader, { open: drawerOpen, logo, logoIcon, styles: headerStyles }), [drawerOpen, header, logo, logoIcon, headerStyles]);
  if (!matchDownMD) {
    return /* @__PURE__ */ jsx(Box, { component: "nav", sx: {
      flexShrink: {
        md: 0
      },
      zIndex: 1200,
      ...navStyles ?? {}
    }, "aria-label": "mailbox folders", children: /* @__PURE__ */ jsxs(MiniDrawerStyled, { variant: "permanent", open: drawerOpen, PaperProps: paperStyles ? {
      sx: paperStyles
    } : void 0, children: [
      drawerHeader,
      drawerContent,
      footer
    ] }) });
  }
  return /* @__PURE__ */ jsxs(Drawer, { container, variant: "temporary", open: drawerOpen, onClose: onDrawerClose, ModalProps: {
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
      width: DRAWER_WIDTH,
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
export {
  MainDrawer as default
};
//# sourceMappingURL=index.js.map
