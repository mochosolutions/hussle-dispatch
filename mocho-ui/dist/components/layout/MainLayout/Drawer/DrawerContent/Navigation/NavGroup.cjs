"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const index = require("../../../../../../node_modules/react-router/dist/index.cjs");
const material = require("@mui/material");
const FormattedMessage = require("../../../../../third-party/FormattedMessage.cjs");
const NavItem = require("./NavItem.cjs");
const NavCollapse = require("./NavCollapse.cjs");
const SimpleBar = require("../../../../../third-party/SimpleBar.cjs");
const Transitions = require("../../../../../extended/Transitions.cjs");
const useConfig = require("../../../../../../hooks/useConfig.cjs");
const index$1 = require("../../../../../../store/index.cjs");
const menu = require("../../../../../../store/reducers/menu.cjs");
const icons = require("@ant-design/icons");
const config = require("../../../../../../types/config.cjs");
const useTheme = require("../../../../../../node_modules/@mui/material/styles/useTheme.cjs");
const styled = require("../../../../../../node_modules/@mui/material/styles/styled.cjs");
const PopperStyled = styled.default(material.Popper)(({
  theme
}) => ({
  overflow: "visible",
  zIndex: 1202,
  minWidth: 180,
  "&:before": {
    content: '""',
    display: "block",
    position: "absolute",
    top: 5,
    left: 32,
    width: 12,
    height: 12,
    transform: "translateY(-50%) rotate(45deg)",
    zIndex: 120,
    borderWidth: "6px",
    borderStyle: "solid",
    borderColor: `${theme.palette.background.paper}  transparent transparent ${theme.palette.background.paper}`
  }
}));
const NavGroup = ({
  item,
  lastItem,
  remItems,
  lastItemId,
  setSelectedItems,
  selectedItems,
  setSelectedLevel,
  selectedLevel
}) => {
  const theme = useTheme();
  const {
    pathname
  } = index.useLocation();
  const {
    menuOrientation
  } = useConfig.useConfig();
  const menu$1 = index$1.useSelector((state) => state.menu);
  const {
    drawerOpen,
    selectedID
  } = menu$1;
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [currentItem, setCurrentItem] = React.useState(item);
  const openMini = Boolean(anchorEl);
  React.useEffect(() => {
    if (lastItem) {
      if (item.id === lastItemId) {
        const localItem = {
          ...item
        };
        const elements = remItems.map((ele) => ele.elements);
        localItem.children = elements.flat(1);
        setCurrentItem(localItem);
      } else {
        setCurrentItem(item);
      }
    }
  }, [item, lastItem, downLG]);
  const checkOpenForParent = (child, id) => {
    child.forEach((ele) => {
      if (ele.children?.length) {
        checkOpenForParent(ele.children, currentItem.id);
      }
      if (ele.url === pathname) {
        index$1.dispatch();
      }
    });
  };
  const checkSelectedOnload = (data) => {
    const childrens = data.children ? data.children : [];
    childrens.forEach((itemCheck) => {
      if (itemCheck.children?.length) {
        checkOpenForParent(itemCheck.children, currentItem.id);
      }
      if (itemCheck.url === pathname) {
        index$1.dispatch(menu.activeID(currentItem.id));
      }
    });
  };
  React.useEffect(() => {
    checkSelectedOnload(currentItem);
    if (openMini) setAnchorEl(null);
  }, [pathname, currentItem]);
  const handleClick = (event) => {
    if (!openMini) {
      setAnchorEl(event?.currentTarget);
    }
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const getItemIcon = () => {
    if (!currentItem?.icon) return null;
    const Icon = currentItem.icon;
    return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Icon, { style: {
      fontSize: 20,
      stroke: "1.5",
      color: selectedID === currentItem.id ? theme.palette.primary.main : theme.palette.secondary.dark
    } });
  };
  const renderNavCollapse = (menuItem) => {
    switch (menuItem.type) {
      case "collapse":
        return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(NavCollapse, { menu: menuItem, setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, level: 1, parentId: currentItem.id }, menuItem.id);
      case "item":
        return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(NavItem, { item: menuItem, level: 1 }, menuItem.id);
      default:
        return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h6", color: "error", align: "center", children: "Fix - Group Collapse or Items" }, menuItem.id);
    }
  };
  const itemIcon = getItemIcon();
  const navCollapse = item.children?.map(renderNavCollapse);
  const moreItems = remItems.map((itemRem, i) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(React.Fragment, { children: [
    itemRem.title && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "caption", sx: {
      pl: 2
    }, children: itemRem.title }),
    itemRem?.elements?.map((menu2) => {
      switch (menu2.type) {
        case "collapse":
          return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(NavCollapse, { menu: menu2, level: 1, parentId: currentItem.id, setSelectedItems, setSelectedLevel, selectedLevel, selectedItems }, menu2.id);
        case "item":
          return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(NavItem, { item: menu2, level: 1 }, menu2.id);
        default:
          return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h6", color: "error", align: "center", children: "Menu Items Error" }, menu2.id);
      }
    })
  ] }, i));
  const items = currentItem.children?.map((menu2) => {
    switch (menu2.type) {
      case "collapse":
        return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(NavCollapse, { menu: menu2, level: 1, parentId: currentItem.id, setSelectedItems, setSelectedLevel, selectedLevel, selectedItems }, menu2.id);
      case "item":
        return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(NavItem, { item: menu2, level: 1 }, menu2.id);
      default:
        return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h6", color: "error", align: "center", children: "Menu Items Error" }, menu2.id);
    }
  });
  const popperId = openMini ? `group-pop-${item.id}` : void 0;
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(emotionReactJsxRuntime_browser_esm.Fragment, { children: menuOrientation === config.MenuOrientation.VERTICAL || downLG ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.List, { subheader: item.title && drawerOpen && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { sx: {
    pl: 3,
    mb: 1.5
  }, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "subtitle2", color: theme.palette.mode === config.ThemeMode.DARK ? "textSecondary" : "text.secondary", children: item.title }),
    item.caption && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "caption", color: "secondary", children: item.caption })
  ] }), sx: {
    mt: drawerOpen && item.title ? 1.5 : 0,
    py: 0,
    zIndex: 0
  }, children: navCollapse }) : /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.List, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ListItemButton, { selected: selectedID === currentItem.id, sx: {
    p: 1,
    my: 0.5,
    mr: 1,
    display: "flex",
    alignItems: "center",
    backgroundColor: "inherit",
    "&.Mui-selected": {
      bgcolor: "transparent"
    }
  }, onMouseEnter: handleClick, onClick: handleClick, onMouseLeave: handleClose, "aria-describedby": popperId, children: [
    itemIcon && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { sx: {
      minWidth: 28
    }, children: currentItem.id === lastItemId ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.DownOutlined, { style: {
      fontSize: 20,
      stroke: "1.5"
    } }) : itemIcon }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemText, { sx: {
      mr: 1
    }, primary: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "body1", color: selectedID === currentItem.id ? theme.palette.primary.main : theme.palette.secondary.dark, children: currentItem.id === lastItemId ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FormattedMessage.FormattedMessage, { id: "More Items" }) : currentItem.title }) }),
    openMini ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.DownOutlined, { style: {
      fontSize: 16,
      stroke: "1.5"
    } }) : /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.RightOutlined, { style: {
      fontSize: 16,
      stroke: "1.5"
    } }),
    anchorEl && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(PopperStyled, { id: popperId, open: openMini, anchorEl, placement: "bottom-start", style: {
      zIndex: 2001
    }, children: ({
      TransitionProps
    }) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Transitions, { in: openMini, ...TransitionProps, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Paper, { sx: {
      mt: 0.5,
      py: 1.25,
      boxShadow: theme.shadows[8],
      backgroundImage: "none"
    }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ClickAwayListener, { onClickAway: handleClose, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(SimpleBar, { sx: {
      overflowX: "hidden",
      overflowY: "auto",
      maxHeight: "calc(100vh - 170px)"
    }, children: currentItem.id !== lastItemId ? items : moreItems }) }) }) }) })
  ] }) }) });
};
module.exports = NavGroup;
//# sourceMappingURL=NavGroup.cjs.map
