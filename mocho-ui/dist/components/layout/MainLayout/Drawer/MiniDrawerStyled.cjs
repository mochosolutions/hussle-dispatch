"use strict";
const config = require("../../../../config.cjs");
const config$1 = require("../../../../types/config.cjs");
const styled = require("../../../../node_modules/@mui/material/styles/styled.cjs");
const Drawer = require("../../../../node_modules/@mui/material/Drawer/Drawer.cjs");
const openedMixin = (theme) => ({
  width: config.DRAWER_WIDTH,
  borderRight: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: "hidden",
  boxShadow: theme.palette.mode === config$1.ThemeMode.DARK ? theme.customShadows.z1 : "none"
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
const MiniDrawerStyled = styled.default(Drawer.default, {
  shouldForwardProp: (prop) => prop !== "open"
})(({
  theme,
  open
}) => ({
  width: config.DRAWER_WIDTH,
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
module.exports = MiniDrawerStyled;
//# sourceMappingURL=MiniDrawerStyled.cjs.map
