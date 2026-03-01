import { DRAWER_WIDTH } from "../../../../config.js";
import { ThemeMode } from "../../../../types/config.js";
import styled from "../../../../node_modules/@mui/material/styles/styled.js";
import Drawer from "../../../../node_modules/@mui/material/Drawer/Drawer.js";
const openedMixin = (theme) => ({
  width: DRAWER_WIDTH,
  borderRight: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: "hidden",
  boxShadow: theme.palette.mode === ThemeMode.DARK ? theme.customShadows.z1 : "none"
});
const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  overflowX: "hidden",
  width: theme.spacing(7.5),
  borderRight: "none",
  boxShadow: theme.customShadows.z1
});
const MiniDrawerStyled = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open"
})(({
  theme,
  open
}) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme)
  },
  ...!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme)
  }
}));
export {
  MiniDrawerStyled as default
};
//# sourceMappingURL=MiniDrawerStyled.js.map
