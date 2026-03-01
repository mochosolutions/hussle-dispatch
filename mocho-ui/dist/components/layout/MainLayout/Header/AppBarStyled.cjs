"use strict";
const config = require("../../../../config.cjs");
const styled = require("../../../../node_modules/@mui/material/styles/styled.cjs");
const AppBar = require("../../../../node_modules/@mui/material/AppBar/AppBar.cjs");
const AppBarStyled = styled.default(AppBar, {
  shouldForwardProp: (prop) => prop !== "open"
})(({
  theme,
  open
}) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  ...!open && {
    width: `calc(100% - ${theme.spacing(7.5)})`
  },
  ...open && {
    marginLeft: config.DRAWER_WIDTH,
    width: `calc(100% - ${config.DRAWER_WIDTH}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  }
}));
module.exports = AppBarStyled;
//# sourceMappingURL=AppBarStyled.cjs.map
