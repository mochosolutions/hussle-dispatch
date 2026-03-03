"use strict";
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const DrawerHeaderStyled = styles.styled(material.Box, {
  shouldForwardProp: (prop) => prop !== "open"
})(({
  theme,
  open
}) => ({
  ...theme.mixins.toolbar,
  display: "flex",
  alignItems: "center",
  justifyContent: open ? "flex-start" : "center",
  paddingLeft: theme.spacing(open ? 3 : 0),
  marginTop: theme.spacing(1)
}));
module.exports = DrawerHeaderStyled;
//# sourceMappingURL=DrawerHeaderStyled.cjs.map
