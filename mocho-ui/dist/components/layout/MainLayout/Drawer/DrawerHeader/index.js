import { jsx } from "../../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { useMediaQuery } from "@mui/material";
import DrawerHeaderStyled from "./DrawerHeaderStyled.js";
import { Logo } from "../../../../Logo/index.js";
import { useConfig } from "../../../../../hooks/useConfig.js";
import { MenuOrientation } from "../../../../../types/config.js";
import useTheme from "../../../../../node_modules/@mui/material/styles/useTheme.js";
const DrawerHeader = ({
  open
}) => {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;
  return /* @__PURE__ */ jsx(DrawerHeaderStyled, { theme, open, sx: {
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
    } : open ? "24px" : 0
  }, children: /* @__PURE__ */ jsx(Logo, { isIcon: !open, sx: {
    width: open ? "auto" : 35,
    height: 35
  } }) });
};
export {
  DrawerHeader as default
};
//# sourceMappingURL=index.js.map
