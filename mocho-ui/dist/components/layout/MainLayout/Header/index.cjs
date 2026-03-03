"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const AppBarStyled = require("./AppBarStyled.cjs");
const index = require("./HeaderContent/Profile/index.cjs");
const IconButton = require("../../../extended/IconButton.cjs");
const useConfig = require("../../../../hooks/useConfig.cjs");
const useLayoutState = require("../../../../hooks/useLayoutState.cjs");
const icons = require("@ant-design/icons");
const config = require("../../../../types/config.cjs");
const Header = ({
  children
}) => {
  const theme = styles.useTheme();
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig();
  const {
    drawerOpen,
    onDrawerToggle
  } = useLayoutState();
  const isHorizontal = menuOrientation === config.MenuOrientation.HORIZONTAL && !downLG;
  const headerContent = children ?? /* @__PURE__ */ jsxRuntime.jsx("div", { style: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto"
  }, children: /* @__PURE__ */ jsxRuntime.jsx(index, {}) });
  const iconBackColorOpen = theme.palette.mode === config.ThemeMode.DARK ? "grey.200" : "grey.300";
  const iconBackColor = theme.palette.mode === config.ThemeMode.DARK ? "background.default" : "grey.100";
  const mainHeader = /* @__PURE__ */ jsxRuntime.jsxs(material.Toolbar, { children: [
    !isHorizontal ? /* @__PURE__ */ jsxRuntime.jsx(IconButton, { "aria-label": "open drawer", onClick: onDrawerToggle, edge: "start", color: "secondary", variant: "light", sx: {
      color: "text.primary",
      bgcolor: drawerOpen ? iconBackColorOpen : iconBackColor,
      ml: {
        xs: 0,
        lg: -2
      }
    }, children: !drawerOpen ? /* @__PURE__ */ jsxRuntime.jsx(icons.MenuUnfoldOutlined, {}) : /* @__PURE__ */ jsxRuntime.jsx(icons.MenuFoldOutlined, {}) }) : null,
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
  return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: !downLG ? /* @__PURE__ */ jsxRuntime.jsx(AppBarStyled, { open: drawerOpen, ...appBar, children: mainHeader }) : /* @__PURE__ */ jsxRuntime.jsx(material.AppBar, { ...appBar, children: mainHeader }) });
};
module.exports = Header;
//# sourceMappingURL=index.cjs.map
