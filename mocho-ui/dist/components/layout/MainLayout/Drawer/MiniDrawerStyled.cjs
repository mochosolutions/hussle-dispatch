"use strict";
const styles = require("@mui/material/styles");
const Drawer = require("@mui/material/Drawer");
const config = require("../../../../config.cjs");
const config$1 = require("../../../../types/config.cjs");
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
const MiniDrawerStyled = styles.styled(Drawer, {
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
