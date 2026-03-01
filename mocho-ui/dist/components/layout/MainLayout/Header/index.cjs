"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const material = require("@mui/material");
const AppBarStyled = require("./AppBarStyled.cjs");
const index$1 = require("./HeaderContent/index.cjs");
const IconButton = require("../../../extended/IconButton.cjs");
const useConfig = require("../../../../hooks/useConfig.cjs");
const index = require("../../../../store/index.cjs");
const menu = require("../../../../store/reducers/menu.cjs");
const icons = require("@ant-design/icons");
const config = require("../../../../types/config.cjs");
const useTheme = require("../../../../node_modules/@mui/material/styles/useTheme.cjs");
const Header = () => {
  const theme = useTheme();
  const dispatch = index.useDispatch();
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig.useConfig();
  const menu$1 = index.useSelector((state) => state.menu);
  const {
    drawerOpen
  } = menu$1;
  const isHorizontal = menuOrientation === config.MenuOrientation.HORIZONTAL && !downLG;
  const headerContent = React.useMemo(() => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index$1, {}), []);
  const iconBackColorOpen = theme.palette.mode === config.ThemeMode.DARK ? "grey.200" : "grey.300";
  const iconBackColor = theme.palette.mode === config.ThemeMode.DARK ? "background.default" : "grey.100";
  const mainHeader = /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Toolbar, { children: [
    !isHorizontal ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(IconButton, { "aria-label": "open drawer", onClick: () => dispatch(menu.openDrawer(!drawerOpen)), edge: "start", color: "secondary", variant: "light", sx: {
      color: "text.primary",
      bgcolor: drawerOpen ? iconBackColorOpen : iconBackColor,
      ml: {
        xs: 0,
        lg: -2
      }
    }, children: !drawerOpen ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.MenuUnfoldOutlined, {}) : /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.MenuFoldOutlined, {}) }) : null,
    headerContent
  ] });
  const appBar = {
    position: "fixed",
    color: "inherit",
    elevation: 0,
    sx: {
      borderBottom: `1px solid ${theme.palette.divider}`,
      zIndex: downLG ? 1100 : 1200,
      width: isHorizontal ? "100%" : drawerOpen ? "calc(100% - 260px)" : {
        xs: "100%",
        lg: "calc(100% - 60px)"
      }
    }
  };
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(emotionReactJsxRuntime_browser_esm.Fragment, { children: !downLG ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(AppBarStyled, { open: drawerOpen, ...appBar, children: mainHeader }) : /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.AppBar, { ...appBar, children: mainHeader }) });
};
module.exports = Header;
//# sourceMappingURL=index.cjs.map
