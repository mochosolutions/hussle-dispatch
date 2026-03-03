"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const reactRouter = require("react-router");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const FormattedMessage = require("../../../../../third-party/FormattedMessage.cjs");
const NavItem = require("./NavItem.cjs");
const NavCollapse = require("./NavCollapse.cjs");
const SimpleBar = require("../../../../../third-party/SimpleBar.cjs");
const Transitions = require("../../../../../extended/Transitions.cjs");
const useConfig = require("../../../../../../hooks/useConfig.cjs");
const useLayoutState = require("../../../../../../hooks/useLayoutState.cjs");
const icons = require("@ant-design/icons");
const config = require("../../../../../../types/config.cjs");
const PopperStyled = styles.styled(material.Popper)(({
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
  selectedLevel,
  openItem,
  onActiveItem,
  selectedID,
  onActiveID
}) => {
  const theme = styles.useTheme();
  const {
    pathname
  } = reactRouter.useLocation();
  const {
    menuOrientation
  } = useConfig();
  const {
    drawerOpen
  } = useLayoutState();
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
        const elements = remItems.map((ele) => ele.elements).filter((el) => Array.isArray(el));
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
        checkOpenForParent(ele.children, currentItem.id ?? "");
      }
      if (ele.url === pathname) {
        onActiveID(id);
      }
    });
  };
  const checkSelectedOnload = (data) => {
    const childrens = data.children ? data.children : [];
    childrens.forEach((itemCheck) => {
      if (itemCheck.children?.length) {
        checkOpenForParent(itemCheck.children, currentItem.id ?? "");
      }
      if (itemCheck.url === pathname) {
        onActiveID(currentItem.id ?? "");
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
    return /* @__PURE__ */ jsxRuntime.jsx(Icon, { style: {
      fontSize: 20,
      stroke: "1.5",
      color: selectedID === currentItem.id ? theme.palette.primary.main : theme.palette.secondary.dark
    } });
  };
  const renderNavCollapse = (menuItem) => {
    switch (menuItem.type) {
      case "collapse":
        return /* @__PURE__ */ jsxRuntime.jsx(NavCollapse, { menu: menuItem, setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, level: 1, parentId: currentItem.id ?? "", openItem, onActiveItem }, menuItem.id);
      case "item":
        return /* @__PURE__ */ jsxRuntime.jsx(NavItem, { item: menuItem, level: 1, openItem, onActiveItem }, menuItem.id);
      default:
        return /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h6", color: "error", align: "center", children: "Fix - Group Collapse or Items" }, menuItem.id);
    }
  };
  const itemIcon = getItemIcon();
  const navCollapse = item.children?.map(renderNavCollapse);
  const moreItems = remItems.map((itemRem, i) => /* @__PURE__ */ jsxRuntime.jsxs(React.Fragment, { children: [
    itemRem.title && /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "caption", sx: {
      pl: 2
    }, children: itemRem.title }),
    itemRem?.elements?.map((menuEl) => {
      switch (menuEl.type) {
        case "collapse":
          return /* @__PURE__ */ jsxRuntime.jsx(NavCollapse, { menu: menuEl, level: 1, parentId: currentItem.id ?? "", setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, openItem, onActiveItem }, menuEl.id);
        case "item":
          return /* @__PURE__ */ jsxRuntime.jsx(NavItem, { item: menuEl, level: 1, openItem, onActiveItem }, menuEl.id);
        default:
          return /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h6", color: "error", align: "center", children: "Menu Items Error" }, menuEl.id);
      }
    })
  ] }, i));
  const items = currentItem.children?.map((menuChild) => {
    switch (menuChild.type) {
      case "collapse":
        return /* @__PURE__ */ jsxRuntime.jsx(NavCollapse, { menu: menuChild, level: 1, parentId: currentItem.id ?? "", setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, openItem, onActiveItem }, menuChild.id);
      case "item":
        return /* @__PURE__ */ jsxRuntime.jsx(NavItem, { item: menuChild, level: 1, openItem, onActiveItem }, menuChild.id);
      default:
        return /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h6", color: "error", align: "center", children: "Menu Items Error" }, menuChild.id);
    }
  });
  const popperId = openMini ? `group-pop-${item.id}` : void 0;
  return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: menuOrientation === config.MenuOrientation.VERTICAL || downLG ? /* @__PURE__ */ jsxRuntime.jsx(material.List, { subheader: item.title && drawerOpen && /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { sx: {
    pl: 3,
    mb: 1.5
  }, children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "subtitle2", color: theme.palette.mode === config.ThemeMode.DARK ? "textSecondary" : "text.secondary", children: item.title }),
    item.caption && /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "caption", color: "secondary", children: item.caption })
  ] }), sx: {
    mt: drawerOpen && item.title ? 1.5 : 0,
    py: 0,
    zIndex: 0
  }, children: navCollapse }) : /* @__PURE__ */ jsxRuntime.jsx(material.List, { children: /* @__PURE__ */ jsxRuntime.jsxs(material.ListItemButton, { selected: selectedID === currentItem.id, sx: {
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
    itemIcon && /* @__PURE__ */ jsxRuntime.jsx(material.ListItemIcon, { sx: {
      minWidth: 28
    }, children: currentItem.id === lastItemId ? /* @__PURE__ */ jsxRuntime.jsx(icons.DownOutlined, { style: {
      fontSize: 20,
      stroke: "1.5"
    } }) : itemIcon }),
    /* @__PURE__ */ jsxRuntime.jsx(material.ListItemText, { sx: {
      mr: 1
    }, primary: /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "body1", color: selectedID === currentItem.id ? theme.palette.primary.main : theme.palette.secondary.dark, children: currentItem.id === lastItemId ? /* @__PURE__ */ jsxRuntime.jsx(FormattedMessage.FormattedMessage, { id: "More Items" }) : currentItem.title }) }),
    openMini ? /* @__PURE__ */ jsxRuntime.jsx(icons.DownOutlined, { style: {
      fontSize: 16,
      stroke: "1.5"
    } }) : /* @__PURE__ */ jsxRuntime.jsx(icons.RightOutlined, { style: {
      fontSize: 16,
      stroke: "1.5"
    } }),
    anchorEl && /* @__PURE__ */ jsxRuntime.jsx(PopperStyled, { id: popperId, open: openMini, anchorEl, placement: "bottom-start", style: {
      zIndex: 2001
    }, children: ({
      TransitionProps
    }) => /* @__PURE__ */ jsxRuntime.jsx(Transitions, { in: openMini, ...TransitionProps, children: /* @__PURE__ */ jsxRuntime.jsx(material.Paper, { sx: {
      mt: 0.5,
      py: 1.25,
      boxShadow: theme.shadows[8],
      backgroundImage: "none"
    }, children: /* @__PURE__ */ jsxRuntime.jsx(material.ClickAwayListener, { onClickAway: handleClose, children: /* @__PURE__ */ jsxRuntime.jsx(SimpleBar, { sx: {
      overflowX: "hidden",
      overflowY: "auto",
      maxHeight: "calc(100vh - 170px)"
    }, children: currentItem.id !== lastItemId ? items : moreItems }) }) }) }) })
  ] }) }) });
};
module.exports = NavGroup;
//# sourceMappingURL=NavGroup.cjs.map
