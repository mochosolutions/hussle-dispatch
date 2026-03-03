"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const DrawerHeaderStyled = require("./DrawerHeaderStyled.cjs");
const index = require("../../../../Logo/index.cjs");
const useConfig = require("../../../../../hooks/useConfig.cjs");
const config = require("../../../../../types/config.cjs");
const DrawerHeader = ({
  open,
  logo,
  logoIcon,
  styles: styles$1
}) => {
  const theme = styles.useTheme();
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig();
  const isHorizontal = menuOrientation === config.MenuOrientation.HORIZONTAL && !downLG;
  const headerStyles = {
    minHeight: isHorizontal ? "unset" : "60px",
    width: isHorizontal ? {
      xs: "100%",
      lg: "424px"
    } : "inherit",
    paddingTop: isHorizontal ? {
      xs: "10px",
      lg: "0"
    } : "8px",
    paddingBottom: isHorizontal ? {
      xs: "18px",
      lg: "0"
    } : "8px",
    paddingLeft: isHorizontal ? {
      xs: "24px",
      lg: "0"
    } : open ? "24px" : 0,
    ...styles$1 ?? {}
  };
  const renderLogo = () => {
    if (!open && logoIcon) return logoIcon;
    if (open && logo) return logo;
    return /* @__PURE__ */ jsxRuntime.jsx(index.Logo, { isIcon: !open, sx: {
      width: open ? "auto" : 35,
      height: 35
    } });
  };
  return /* @__PURE__ */ jsxRuntime.jsx(DrawerHeaderStyled, { theme, open, sx: headerStyles, children: renderLogo() });
};
module.exports = DrawerHeader;
//# sourceMappingURL=index.cjs.map
