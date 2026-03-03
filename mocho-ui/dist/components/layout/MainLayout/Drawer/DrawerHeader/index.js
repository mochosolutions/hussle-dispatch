import { jsx } from "@emotion/react/jsx-runtime";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import DrawerHeaderStyled from "./DrawerHeaderStyled.js";
import { Logo } from "../../../../Logo/index.js";
import useConfig from "../../../../../hooks/useConfig.js";
import { MenuOrientation } from "../../../../../types/config.js";
const DrawerHeader = ({
  open,
  logo,
  logoIcon,
  styles
}) => {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;
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
    ...styles ?? {}
  };
  const renderLogo = () => {
    if (!open && logoIcon) return logoIcon;
    if (open && logo) return logo;
    return /* @__PURE__ */ jsx(Logo, { isIcon: !open, sx: {
      width: open ? "auto" : 35,
      height: 35
    } });
  };
  return /* @__PURE__ */ jsx(DrawerHeaderStyled, { theme, open, sx: headerStyles, children: renderLogo() });
};
export {
  DrawerHeader as default
};
//# sourceMappingURL=index.js.map
