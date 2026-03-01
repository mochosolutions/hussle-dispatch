import { jsx, jsxs } from "../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { useMemo } from "react";
import { useMediaQuery, Box, Drawer } from "@mui/material";
import DrawerHeader from "./DrawerHeader/index.js";
import DrawerContent from "./DrawerContent/index.js";
import MiniDrawerStyled from "./MiniDrawerStyled.js";
import { DRAWER_WIDTH } from "../../../../config.js";
import { useDispatch, useSelector } from "../../../../store/index.js";
import { openDrawer } from "../../../../store/reducers/menu.js";
import useTheme from "../../../../node_modules/@mui/material/styles/useTheme.js";
const MainDrawer = ({
  window
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("lg"));
  const menu = useSelector((state) => state.menu);
  const {
    drawerOpen
  } = menu;
  console.log("Drawer render", drawerOpen);
  const container = window !== void 0 ? () => window().document.body : void 0;
  const drawerContent = useMemo(() => /* @__PURE__ */ jsx(DrawerContent, {}), []);
  const drawerHeader = useMemo(() => /* @__PURE__ */ jsx(DrawerHeader, { open: drawerOpen }), [drawerOpen]);
  if (!matchDownMD) {
    return /* @__PURE__ */ jsx(Box, { component: "nav", sx: {
      flexShrink: {
        md: 0
      },
      zIndex: 1200
    }, "aria-label": "mailbox folders", children: /* @__PURE__ */ jsxs(MiniDrawerStyled, { variant: "permanent", open: drawerOpen, children: [
      drawerHeader,
      drawerContent
    ] }) });
  }
  console.log("Rendering mobile drawer, open:", drawerOpen);
  return /* @__PURE__ */ jsxs(Drawer, { container, variant: "temporary", open: drawerOpen, onClose: () => {
    dispatch(openDrawer(false));
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
      width: DRAWER_WIDTH,
      borderRight: `1px solid ${theme.palette.divider}`,
      backgroundImage: "none",
      boxShadow: "inherit"
    }
  }, children: [
    drawerHeader,
    drawerContent
  ] });
};
export {
  MainDrawer as default
};
//# sourceMappingURL=index.js.map
