"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const DrawerHeaderStyled = require("./DrawerHeaderStyled.cjs");
const index = require("../../../../Logo/index.cjs");
const useConfig = require("../../../../../hooks/useConfig.cjs");
const config = require("../../../../../types/config.cjs");
const useTheme = require("../../../../../node_modules/@mui/material/styles/useTheme.cjs");
const DrawerHeader = ({
  open
}) => {
  const theme = useTheme();
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig.useConfig();
  const isHorizontal = menuOrientation === config.MenuOrientation.HORIZONTAL && !downLG;
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(DrawerHeaderStyled, { theme, open, sx: {
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
  }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index.Logo, { isIcon: !open, sx: {
    width: open ? "auto" : 35,
    height: 35
  } }) });
};
module.exports = DrawerHeader;
//# sourceMappingURL=index.cjs.map
