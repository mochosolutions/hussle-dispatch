import { jsx, Fragment, jsxs } from "@emotion/react/jsx-runtime";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery, AppBar, Toolbar } from "@mui/material";
import AppBarStyled from "./AppBarStyled.js";
import Profile from "./HeaderContent/Profile/index.js";
import IconButton from "../../../extended/IconButton.js";
import useConfig from "../../../../hooks/useConfig.js";
import useLayoutState from "../../../../hooks/useLayoutState.js";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import { MenuOrientation, ThemeMode } from "../../../../types/config.js";
const Header = ({
  children
}) => {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig();
  const {
    drawerOpen,
    onDrawerToggle
  } = useLayoutState();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;
  const headerContent = children ?? /* @__PURE__ */ jsx("div", { style: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto"
  }, children: /* @__PURE__ */ jsx(Profile, {}) });
  const iconBackColorOpen = theme.palette.mode === ThemeMode.DARK ? "grey.200" : "grey.300";
  const iconBackColor = theme.palette.mode === ThemeMode.DARK ? "background.default" : "grey.100";
  const mainHeader = /* @__PURE__ */ jsxs(Toolbar, { children: [
    !isHorizontal ? /* @__PURE__ */ jsx(IconButton, { "aria-label": "open drawer", onClick: onDrawerToggle, edge: "start", color: "secondary", variant: "light", sx: {
      color: "text.primary",
      bgcolor: drawerOpen ? iconBackColorOpen : iconBackColor,
      ml: {
        xs: 0,
        lg: -2
      }
    }, children: !drawerOpen ? /* @__PURE__ */ jsx(MenuUnfoldOutlined, {}) : /* @__PURE__ */ jsx(MenuFoldOutlined, {}) }) : null,
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
  return /* @__PURE__ */ jsx(Fragment, { children: !downLG ? /* @__PURE__ */ jsx(AppBarStyled, { open: drawerOpen, ...appBar, children: mainHeader }) : /* @__PURE__ */ jsx(AppBar, { ...appBar, children: mainHeader }) });
};
export {
  Header as default
};
//# sourceMappingURL=index.js.map
