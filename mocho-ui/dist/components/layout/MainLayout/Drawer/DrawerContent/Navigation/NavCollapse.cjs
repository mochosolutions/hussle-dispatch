"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const reactRouterDom = require("react-router-dom");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const NavItem = require("./NavItem.cjs");
const Dot = require("../../../../../extended/Dot.cjs");
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
  const theme = styles.useTheme();
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    drawerOpen
  } = useLayoutState();
  const {
    menuOrientation
  } = useConfig();
  const navigate = reactRouterDom.useNavigate();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
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
  React.useEffect(() => {
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
  } = reactRouterDom.useLocation();
  React.useEffect(() => {
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
  React.useEffect(() => {
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
  React.useEffect(() => {
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
        return /* @__PURE__ */ jsxRuntime.jsx(NavCollapse, { setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, menu: item, level: level + 1, parentId, openItem, onActiveItem }, item.id);
      case "item":
        return /* @__PURE__ */ jsxRuntime.jsx(NavItem, { item, level: level + 1, openItem, onActiveItem }, item.id);
      default:
        return /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h6", color: "error", align: "center", children: "Fix - Collapse or Item" }, item.id);
    }
  });
  const isSelected = selected === menu.id;
  const borderIcon = level === 1 ? /* @__PURE__ */ jsxRuntime.jsx(icons.BorderOutlined, { style: {
    fontSize: "1rem"
  } }) : false;
  const Icon = menu.icon;
  const menuIcon = Icon ? /* @__PURE__ */ jsxRuntime.jsx(Icon, { style: {
    fontSize: drawerOpen ? "1rem" : "1.25rem"
  } }) : borderIcon;
  const textColor = theme.palette.mode === config.ThemeMode.DARK ? "grey.400" : "text.primary";
  const iconSelectedColor = theme.palette.mode === config.ThemeMode.DARK && drawerOpen ? theme.palette.text.primary : theme.palette.primary.main;
  const popperId = miniMenuOpened ? `collapse-pop-${menu.id}` : void 0;
  const FlexBox = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%"
  };
  return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: menuOrientation === config.MenuOrientation.VERTICAL || downLG ? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(material.ListItemButton, { disableRipple: true, selected: selected === menu.id, ...!drawerOpen && {
      onMouseEnter: handleClick,
      onMouseLeave: handleClose
    }, onClick: handleClick, sx: {
      pl: drawerOpen ? `${level * 28}px` : 1.5,
      py: !drawerOpen && level === 1 ? 1.25 : 1,
      ...drawerOpen && {
        "&:hover": {
          bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "divider" : "primary.lighter"
        },
        "&.Mui-selected": {
          bgcolor: "transparent",
          color: iconSelectedColor,
          "&:hover": {
            color: iconSelectedColor,
            bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "divider" : "transparent"
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
      menuIcon && /* @__PURE__ */ jsxRuntime.jsx(material.ListItemIcon, { onClick: handlerIconLink, sx: {
        minWidth: 28,
        color: selected === menu.id ? "primary.main" : textColor,
        ...!drawerOpen && {
          borderRadius: 1.5,
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          "&:hover": {
            bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "secondary.light" : "secondary.lighter"
          }
        },
        ...!drawerOpen && selected === menu.id && {
          bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "primary.900" : "primary.lighter",
          "&:hover": {
            bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "primary.darker" : "primary.lighter"
          }
        }
      }, children: menuIcon }),
      (drawerOpen || !drawerOpen && level !== 1) && /* @__PURE__ */ jsxRuntime.jsx(material.ListItemText, { primary: /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h6", color: selected === menu.id ? "primary" : textColor, children: menu.title }), secondary: menu.caption && /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "caption", color: "secondary", children: menu.caption }) }),
      (drawerOpen || !drawerOpen && level !== 1) && (miniMenuOpened || open ? /* @__PURE__ */ jsxRuntime.jsx(icons.UpOutlined, { style: {
        fontSize: "0.625rem",
        marginLeft: 1,
        color: theme.palette.primary.main
      } }) : /* @__PURE__ */ jsxRuntime.jsx(icons.DownOutlined, { style: {
        fontSize: "0.625rem",
        marginLeft: 1
      } })),
      !drawerOpen && /* @__PURE__ */ jsxRuntime.jsx(PopperStyled, { open: miniMenuOpened, anchorEl, placement: "right-start", style: {
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
      }) => /* @__PURE__ */ jsxRuntime.jsx(Transitions, { in: miniMenuOpened, ...TransitionProps, children: /* @__PURE__ */ jsxRuntime.jsx(material.Paper, { sx: {
        overflow: "hidden",
        mt: 1.5,
        boxShadow: theme.customShadows.z1,
        backgroundImage: "none",
        border: `1px solid ${theme.palette.divider}`
      }, children: /* @__PURE__ */ jsxRuntime.jsx(material.ClickAwayListener, { onClickAway: handleClose, children: /* @__PURE__ */ jsxRuntime.jsx(SimpleBar, { sx: {
        overflowX: "hidden",
        overflowY: "auto",
        maxHeight: "calc(100vh - 170px)"
      }, children: navCollapse }) }) }) }) })
    ] }),
    drawerOpen && /* @__PURE__ */ jsxRuntime.jsx(material.Collapse, { in: open, timeout: "auto", unmountOnExit: true, children: /* @__PURE__ */ jsxRuntime.jsx(material.List, { sx: {
      p: 0
    }, children: navCollapse }) })
  ] }) : /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: /* @__PURE__ */ jsxRuntime.jsxs(material.ListItemButton, { id: `boundary-${popperId}`, disableRipple: true, selected: isSelected, onMouseEnter: handleHover, onMouseLeave: handleClose, onClick: handleHover, "aria-describedby": popperId, sx: {
    "&.Mui-selected": {
      bgcolor: "transparent"
    }
  }, children: [
    /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { onClick: handlerIconLink, sx: FlexBox, children: [
      menuIcon && /* @__PURE__ */ jsxRuntime.jsx(material.ListItemIcon, { sx: {
        my: "auto",
        minWidth: !menu.icon ? 18 : 36,
        color: theme.palette.secondary.dark
      }, children: menuIcon }),
      !menuIcon && level !== 1 && /* @__PURE__ */ jsxRuntime.jsx(material.ListItemIcon, { sx: {
        my: "auto",
        minWidth: !menu.icon ? 18 : 36,
        bgcolor: "transparent",
        "&:hover": {
          bgcolor: "transparent"
        }
      }, children: /* @__PURE__ */ jsxRuntime.jsx(Dot, { size: 4, color: isSelected ? "primary" : "secondary" }) }),
      /* @__PURE__ */ jsxRuntime.jsx(material.ListItemText, { primary: /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "body1", color: "inherit", sx: {
        my: "auto"
      }, children: menu.title }) }),
      miniMenuOpened ? /* @__PURE__ */ jsxRuntime.jsx(icons.RightOutlined, {}) : /* @__PURE__ */ jsxRuntime.jsx(icons.DownOutlined, {})
    ] }),
    anchorEl && /* @__PURE__ */ jsxRuntime.jsx(PopperStyled, { id: popperId, open: miniMenuOpened, anchorEl, placement: "right-start", style: {
      zIndex: 2001
    }, modifiers: [{
      name: "offset",
      options: {
        offset: [-10, 0]
      }
    }], children: ({
      TransitionProps
    }) => /* @__PURE__ */ jsxRuntime.jsx(Transitions, { in: miniMenuOpened, ...TransitionProps, children: /* @__PURE__ */ jsxRuntime.jsx(material.Paper, { sx: {
      overflow: "hidden",
      mt: 1.5,
      py: 0.5,
      boxShadow: theme.shadows[8],
      backgroundImage: "none"
    }, children: /* @__PURE__ */ jsxRuntime.jsx(material.ClickAwayListener, { onClickAway: handleClose, children: /* @__PURE__ */ jsxRuntime.jsx(SimpleBar, { sx: {
      overflowX: "hidden",
      overflowY: "auto",
      maxHeight: "calc(100vh - 170px)"
    }, children: navCollapse }) }) }) }) })
  ] }) }) });
};
module.exports = NavCollapse;
//# sourceMappingURL=NavCollapse.cjs.map
