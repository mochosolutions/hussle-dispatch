import { jsx, Fragment, jsxs } from "@emotion/react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme, styled } from "@mui/material/styles";
import { useMediaQuery, Typography, ListItemButton, ListItemIcon, ListItemText, Paper, ClickAwayListener, Collapse, List, Box, Popper } from "@mui/material";
import NavItem from "./NavItem.js";
import Dot from "../../../../../extended/Dot.js";
import SimpleBar from "../../../../../third-party/SimpleBar.js";
import Transitions from "../../../../../extended/Transitions.js";
import useConfig from "../../../../../../hooks/useConfig.js";
import useLayoutState from "../../../../../../hooks/useLayoutState.js";
import { UpOutlined, DownOutlined, RightOutlined, BorderOutlined } from "@ant-design/icons";
import { ThemeMode, MenuOrientation } from "../../../../../../types/config.js";
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
    top: 38,
    left: -5,
    width: 10,
    height: 10,
    backgroundColor: theme.palette.background.paper,
    transform: "translateY(-50%) rotate(45deg)",
    zIndex: 120,
    borderLeft: `1px solid ${theme.palette.grey.A800}`,
    borderBottom: `1px solid ${theme.palette.grey.A800}`
  }
}));
const NavCollapse = ({
  menu,
  level,
  parentId,
  setSelectedItems,
  selectedItems,
  setSelectedLevel,
  selectedLevel,
  openItem,
  onActiveItem
}) => {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    drawerOpen
  } = useLayoutState();
  const {
    menuOrientation
  } = useConfig();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => {
    setAnchorEl(null);
    setSelectedLevel(level);
    if (drawerOpen) {
      setOpen(!open);
      setSelected(!selected ? menu.id : null);
      setSelectedItems(!selected ? menu.id : "");
      if (menu.url) navigate(`${menu.url}`);
    } else {
      setAnchorEl(event?.currentTarget);
    }
  };
  const handlerIconLink = () => {
    if (!drawerOpen) {
      if (menu.url) navigate(`${menu.url}`);
      setSelected(menu.id);
    }
  };
  const handleHover = (event) => {
    setAnchorEl(event?.currentTarget);
    if (!drawerOpen) {
      setSelected(menu.id);
    }
  };
  const miniMenuOpened = Boolean(anchorEl);
  const handleClose = () => {
    setOpen(false);
    if (!miniMenuOpened) {
      if (!menu.url) {
        setSelected(null);
      }
    }
    setAnchorEl(null);
  };
  useEffect(() => {
    if (selected === selectedItems) {
      if (level === 1) {
        setOpen(true);
      }
    } else if (level === selectedLevel) {
      setOpen(false);
      if (!miniMenuOpened && !drawerOpen && !selected) {
        setSelected(null);
      }
      if (drawerOpen) {
        setSelected(null);
      }
    }
  }, [selectedItems, level, selected, miniMenuOpened, drawerOpen, selectedLevel]);
  const {
    pathname
  } = useLocation();
  useEffect(() => {
    if (pathname === menu.url) {
      setSelected(menu.id);
    }
  }, [pathname, menu.url, menu.id]);
  const checkOpenForParent = (child, id) => {
    child.forEach((item) => {
      if (item.url === pathname) {
        setOpen(true);
        setSelected(id);
      }
    });
  };
  useEffect(() => {
    setOpen(false);
    if (!miniMenuOpened) {
      setSelected(null);
    }
    if (miniMenuOpened) setAnchorEl(null);
    if (menu.children) {
      menu.children.forEach((item) => {
        if (item.children?.length) {
          checkOpenForParent(item.children, menu.id ?? "");
        }
        if (pathname && pathname.includes("product-details")) {
          if (item.url && item.url.includes("product-details")) {
            setSelected(menu.id);
            setOpen(true);
          }
        }
        if (item.url === pathname) {
          setSelected(menu.id);
          setOpen(true);
        }
      });
    }
  }, [pathname, menu.children]);
  useEffect(() => {
    if (menu.url === pathname && menu.id) {
      onActiveItem([menu.id]);
      setSelected(menu.id);
      setAnchorEl(null);
      setOpen(true);
    }
  }, [pathname, menu, onActiveItem]);
  const navCollapse = menu.children?.map((item) => {
    switch (item.type) {
      case "collapse":
        return /* @__PURE__ */ jsx(NavCollapse, { setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, menu: item, level: level + 1, parentId, openItem, onActiveItem }, item.id);
      case "item":
        return /* @__PURE__ */ jsx(NavItem, { item, level: level + 1, openItem, onActiveItem }, item.id);
      default:
        return /* @__PURE__ */ jsx(Typography, { variant: "h6", color: "error", align: "center", children: "Fix - Collapse or Item" }, item.id);
    }
  });
  const isSelected = selected === menu.id;
  const borderIcon = level === 1 ? /* @__PURE__ */ jsx(BorderOutlined, { style: {
    fontSize: "1rem"
  } }) : false;
  const Icon = menu.icon;
  const menuIcon = Icon ? /* @__PURE__ */ jsx(Icon, { style: {
    fontSize: drawerOpen ? "1rem" : "1.25rem"
  } }) : borderIcon;
  const textColor = theme.palette.mode === ThemeMode.DARK ? "grey.400" : "text.primary";
  const iconSelectedColor = theme.palette.mode === ThemeMode.DARK && drawerOpen ? theme.palette.text.primary : theme.palette.primary.main;
  const popperId = miniMenuOpened ? `collapse-pop-${menu.id}` : void 0;
  const FlexBox = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%"
  };
  return /* @__PURE__ */ jsx(Fragment, { children: menuOrientation === MenuOrientation.VERTICAL || downLG ? /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(ListItemButton, { disableRipple: true, selected: selected === menu.id, ...!drawerOpen && {
      onMouseEnter: handleClick,
      onMouseLeave: handleClose
    }, onClick: handleClick, sx: {
      pl: drawerOpen ? `${level * 28}px` : 1.5,
      py: !drawerOpen && level === 1 ? 1.25 : 1,
      ...drawerOpen && {
        "&:hover": {
          bgcolor: theme.palette.mode === ThemeMode.DARK ? "divider" : "primary.lighter"
        },
        "&.Mui-selected": {
          bgcolor: "transparent",
          color: iconSelectedColor,
          "&:hover": {
            color: iconSelectedColor,
            bgcolor: theme.palette.mode === ThemeMode.DARK ? "divider" : "transparent"
          }
        }
      },
      ...!drawerOpen && {
        "&:hover": {
          bgcolor: "transparent"
        },
        "&.Mui-selected": {
          "&:hover": {
            bgcolor: "transparent"
          },
          bgcolor: "transparent"
        }
      }
    }, children: [
      menuIcon && /* @__PURE__ */ jsx(ListItemIcon, { onClick: handlerIconLink, sx: {
        minWidth: 28,
        color: selected === menu.id ? "primary.main" : textColor,
        ...!drawerOpen && {
          borderRadius: 1.5,
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          "&:hover": {
            bgcolor: theme.palette.mode === ThemeMode.DARK ? "secondary.light" : "secondary.lighter"
          }
        },
        ...!drawerOpen && selected === menu.id && {
          bgcolor: theme.palette.mode === ThemeMode.DARK ? "primary.900" : "primary.lighter",
          "&:hover": {
            bgcolor: theme.palette.mode === ThemeMode.DARK ? "primary.darker" : "primary.lighter"
          }
        }
      }, children: menuIcon }),
      (drawerOpen || !drawerOpen && level !== 1) && /* @__PURE__ */ jsx(ListItemText, { primary: /* @__PURE__ */ jsx(Typography, { variant: "h6", color: selected === menu.id ? "primary" : textColor, children: menu.title }), secondary: menu.caption && /* @__PURE__ */ jsx(Typography, { variant: "caption", color: "secondary", children: menu.caption }) }),
      (drawerOpen || !drawerOpen && level !== 1) && (miniMenuOpened || open ? /* @__PURE__ */ jsx(UpOutlined, { style: {
        fontSize: "0.625rem",
        marginLeft: 1,
        color: theme.palette.primary.main
      } }) : /* @__PURE__ */ jsx(DownOutlined, { style: {
        fontSize: "0.625rem",
        marginLeft: 1
      } })),
      !drawerOpen && /* @__PURE__ */ jsx(PopperStyled, { open: miniMenuOpened, anchorEl, placement: "right-start", style: {
        zIndex: 2001
      }, popperOptions: {
        modifiers: [{
          name: "offset",
          options: {
            offset: [-12, 1]
          }
        }]
      }, children: ({
        TransitionProps
      }) => /* @__PURE__ */ jsx(Transitions, { in: miniMenuOpened, ...TransitionProps, children: /* @__PURE__ */ jsx(Paper, { sx: {
        overflow: "hidden",
        mt: 1.5,
        boxShadow: theme.customShadows.z1,
        backgroundImage: "none",
        border: `1px solid ${theme.palette.divider}`
      }, children: /* @__PURE__ */ jsx(ClickAwayListener, { onClickAway: handleClose, children: /* @__PURE__ */ jsx(SimpleBar, { sx: {
        overflowX: "hidden",
        overflowY: "auto",
        maxHeight: "calc(100vh - 170px)"
      }, children: navCollapse }) }) }) }) })
    ] }),
    drawerOpen && /* @__PURE__ */ jsx(Collapse, { in: open, timeout: "auto", unmountOnExit: true, children: /* @__PURE__ */ jsx(List, { sx: {
      p: 0
    }, children: navCollapse }) })
  ] }) : /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(ListItemButton, { id: `boundary-${popperId}`, disableRipple: true, selected: isSelected, onMouseEnter: handleHover, onMouseLeave: handleClose, onClick: handleHover, "aria-describedby": popperId, sx: {
    "&.Mui-selected": {
      bgcolor: "transparent"
    }
  }, children: [
    /* @__PURE__ */ jsxs(Box, { onClick: handlerIconLink, sx: FlexBox, children: [
      menuIcon && /* @__PURE__ */ jsx(ListItemIcon, { sx: {
        my: "auto",
        minWidth: !menu.icon ? 18 : 36,
        color: theme.palette.secondary.dark
      }, children: menuIcon }),
      !menuIcon && level !== 1 && /* @__PURE__ */ jsx(ListItemIcon, { sx: {
        my: "auto",
        minWidth: !menu.icon ? 18 : 36,
        bgcolor: "transparent",
        "&:hover": {
          bgcolor: "transparent"
        }
      }, children: /* @__PURE__ */ jsx(Dot, { size: 4, color: isSelected ? "primary" : "secondary" }) }),
      /* @__PURE__ */ jsx(ListItemText, { primary: /* @__PURE__ */ jsx(Typography, { variant: "body1", color: "inherit", sx: {
        my: "auto"
      }, children: menu.title }) }),
      miniMenuOpened ? /* @__PURE__ */ jsx(RightOutlined, {}) : /* @__PURE__ */ jsx(DownOutlined, {})
    ] }),
    anchorEl && /* @__PURE__ */ jsx(PopperStyled, { id: popperId, open: miniMenuOpened, anchorEl, placement: "right-start", style: {
      zIndex: 2001
    }, modifiers: [{
      name: "offset",
      options: {
        offset: [-10, 0]
      }
    }], children: ({
      TransitionProps
    }) => /* @__PURE__ */ jsx(Transitions, { in: miniMenuOpened, ...TransitionProps, children: /* @__PURE__ */ jsx(Paper, { sx: {
      overflow: "hidden",
      mt: 1.5,
      py: 0.5,
      boxShadow: theme.shadows[8],
      backgroundImage: "none"
    }, children: /* @__PURE__ */ jsx(ClickAwayListener, { onClickAway: handleClose, children: /* @__PURE__ */ jsx(SimpleBar, { sx: {
      overflowX: "hidden",
      overflowY: "auto",
      maxHeight: "calc(100vh - 170px)"
    }, children: navCollapse }) }) }) }) })
  ] }) }) });
};
export {
  NavCollapse as default
};
//# sourceMappingURL=NavCollapse.js.map
