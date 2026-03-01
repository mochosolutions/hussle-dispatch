import { Box } from "@mui/material";
import styled from "../../../../../node_modules/@mui/material/styles/styled.js";
const DrawerHeaderStyled = styled(Box, {
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
export {
  DrawerHeaderStyled as default
};
//# sourceMappingURL=DrawerHeaderStyled.js.map
