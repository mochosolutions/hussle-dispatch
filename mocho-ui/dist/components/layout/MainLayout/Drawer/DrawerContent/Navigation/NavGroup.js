import { jsxs, jsx, Fragment as Fragment$1 } from "@emotion/react/jsx-runtime";
import { useState, useEffect, Fragment } from "react";
import { useLocation } from "react-router";
import { useTheme, styled } from "@mui/material/styles";
import { useMediaQuery, Typography, List, Box, ListItemButton, ListItemIcon, ListItemText, Paper, ClickAwayListener, Popper } from "@mui/material";
import { FormattedMessage } from "../../../../../third-party/FormattedMessage.js";
import NavItem from "./NavItem.js";
import NavCollapse from "./NavCollapse.js";
import SimpleBar from "../../../../../third-party/SimpleBar.js";
import Transitions from "../../../../../extended/Transitions.js";
import useConfig from "../../../../../../hooks/useConfig.js";
import useLayoutState from "../../../../../../hooks/useLayoutState.js";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import { MenuOrientation, ThemeMode } from "../../../../../../types/config.js";
const PopperStyled = styled(Popper)(({
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
  const theme = useTheme();
  const {
    pathname
  } = useLocation();
  const {
    menuOrientation
  } = useConfig();
  const {
    drawerOpen
  } = useLayoutState();
  const downLG = useMediaQuery(theme.breakpoints.down("lg"));
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentItem, setCurrentItem] = useState(item);
  const openMini = Boolean(anchorEl);
  useEffect(() => {
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
  useEffect(() => {
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
    return /* @__PURE__ */ jsx(Icon, { style: {
      fontSize: 20,
      stroke: "1.5",
      color: selectedID === currentItem.id ? theme.palette.primary.main : theme.palette.secondary.dark
    } });
  };
  const renderNavCollapse = (menuItem) => {
    switch (menuItem.type) {
      case "collapse":
        return /* @__PURE__ */ jsx(NavCollapse, { menu: menuItem, setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, level: 1, parentId: currentItem.id ?? "", openItem, onActiveItem }, menuItem.id);
      case "item":
        return /* @__PURE__ */ jsx(NavItem, { item: menuItem, level: 1, openItem, onActiveItem }, menuItem.id);
      default:
        return /* @__PURE__ */ jsx(Typography, { variant: "h6", color: "error", align: "center", children: "Fix - Group Collapse or Items" }, menuItem.id);
    }
  };
  const itemIcon = getItemIcon();
  const navCollapse = item.children?.map(renderNavCollapse);
  const moreItems = remItems.map((itemRem, i) => /* @__PURE__ */ jsxs(Fragment, { children: [
    itemRem.title && /* @__PURE__ */ jsx(Typography, { variant: "caption", sx: {
      pl: 2
    }, children: itemRem.title }),
    itemRem?.elements?.map((menuEl) => {
      switch (menuEl.type) {
        case "collapse":
          return /* @__PURE__ */ jsx(NavCollapse, { menu: menuEl, level: 1, parentId: currentItem.id ?? "", setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, openItem, onActiveItem }, menuEl.id);
        case "item":
          return /* @__PURE__ */ jsx(NavItem, { item: menuEl, level: 1, openItem, onActiveItem }, menuEl.id);
        default:
          return /* @__PURE__ */ jsx(Typography, { variant: "h6", color: "error", align: "center", children: "Menu Items Error" }, menuEl.id);
      }
    })
  ] }, i));
  const items = currentItem.children?.map((menuChild) => {
    switch (menuChild.type) {
      case "collapse":
        return /* @__PURE__ */ jsx(NavCollapse, { menu: menuChild, level: 1, parentId: currentItem.id ?? "", setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, openItem, onActiveItem }, menuChild.id);
      case "item":
        return /* @__PURE__ */ jsx(NavItem, { item: menuChild, level: 1, openItem, onActiveItem }, menuChild.id);
      default:
        return /* @__PURE__ */ jsx(Typography, { variant: "h6", color: "error", align: "center", children: "Menu Items Error" }, menuChild.id);
    }
  });
  const popperId = openMini ? `group-pop-${item.id}` : void 0;
  return /* @__PURE__ */ jsx(Fragment$1, { children: menuOrientation === MenuOrientation.VERTICAL || downLG ? /* @__PURE__ */ jsx(List, { subheader: item.title && drawerOpen && /* @__PURE__ */ jsxs(Box, { sx: {
    pl: 3,
    mb: 1.5
  }, children: [
    /* @__PURE__ */ jsx(Typography, { variant: "subtitle2", color: theme.palette.mode === ThemeMode.DARK ? "textSecondary" : "text.secondary", children: item.title }),
    item.caption && /* @__PURE__ */ jsx(Typography, { variant: "caption", color: "secondary", children: item.caption })
  ] }), sx: {
    mt: drawerOpen && item.title ? 1.5 : 0,
    py: 0,
    zIndex: 0
  }, children: navCollapse }) : /* @__PURE__ */ jsx(List, { children: /* @__PURE__ */ jsxs(ListItemButton, { selected: selectedID === currentItem.id, sx: {
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
    itemIcon && /* @__PURE__ */ jsx(ListItemIcon, { sx: {
      minWidth: 28
    }, children: currentItem.id === lastItemId ? /* @__PURE__ */ jsx(DownOutlined, { style: {
      fontSize: 20,
      stroke: "1.5"
    } }) : itemIcon }),
    /* @__PURE__ */ jsx(ListItemText, { sx: {
      mr: 1
    }, primary: /* @__PURE__ */ jsx(Typography, { variant: "body1", color: selectedID === currentItem.id ? theme.palette.primary.main : theme.palette.secondary.dark, children: currentItem.id === lastItemId ? /* @__PURE__ */ jsx(FormattedMessage, { id: "More Items" }) : currentItem.title }) }),
    openMini ? /* @__PURE__ */ jsx(DownOutlined, { style: {
      fontSize: 16,
      stroke: "1.5"
    } }) : /* @__PURE__ */ jsx(RightOutlined, { style: {
      fontSize: 16,
      stroke: "1.5"
    } }),
    anchorEl && /* @__PURE__ */ jsx(PopperStyled, { id: popperId, open: openMini, anchorEl, placement: "bottom-start", style: {
      zIndex: 2001
    }, children: ({
      TransitionProps
    }) => /* @__PURE__ */ jsx(Transitions, { in: openMini, ...TransitionProps, children: /* @__PURE__ */ jsx(Paper, { sx: {
      mt: 0.5,
      py: 1.25,
      boxShadow: theme.shadows[8],
      backgroundImage: "none"
    }, children: /* @__PURE__ */ jsx(ClickAwayListener, { onClickAway: handleClose, children: /* @__PURE__ */ jsx(SimpleBar, { sx: {
      overflowX: "hidden",
      overflowY: "auto",
      maxHeight: "calc(100vh - 170px)"
    }, children: currentItem.id !== lastItemId ? items : moreItems }) }) }) }) })
  ] }) }) });
};
export {
  NavGroup as default
};
//# sourceMappingURL=NavGroup.js.map
