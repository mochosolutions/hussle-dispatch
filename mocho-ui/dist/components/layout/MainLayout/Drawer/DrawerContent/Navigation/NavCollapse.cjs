"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const reactRouterDom = require("react-router-dom");
const material = require("@mui/material");
const NavItem = require("./NavItem.cjs");
const Dot = require("../../../../../extended/Dot.cjs");
const SimpleBar = require("../../../../../third-party/SimpleBar.cjs");
const Transitions = require("../../../../../extended/Transitions.cjs");
const useConfig = require("../../../../../../hooks/useConfig.cjs");
const index = require("../../../../../../store/index.cjs");
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
  menu: menu$1,
  level,
  parentId,
  setSelectedItems,
  selectedItems,
  setSelectedLevel,
  selectedLevel
}) => {
  const theme = useTheme();
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const menuState = index.useSelector((state) => state.menu);
  const {
    drawerOpen
  } = menuState;
  const {
    menuOrientation
  } = useConfig.useConfig();
  const Navigation = reactRouterDom.useNavigate();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleClick = (event) => {
    setAnchorEl(null);
    setSelectedLevel(level);
    if (drawerOpen) {
      setOpen(!open);
      setSelected(!selected ? menu$1.id : null);
      setSelectedItems(!selected ? menu$1.id : "");
      if (menu$1.url) Navigation(`${menu$1.url}`);
    } else {
      setAnchorEl(event?.currentTarget);
    }
  };
  const handlerIconLink = () => {
    if (!drawerOpen) {
      if (menu$1.url) Navigation(`${menu$1.url}`);
      setSelected(menu$1.id);
    }
  };
  const handleHover = (event) => {
    setAnchorEl(event?.currentTarget);
    if (!drawerOpen) {
      setSelected(menu$1.id);
    }
  };
  const miniMenuOpened = Boolean(anchorEl);
  const handleClose = () => {
    setOpen(false);
    if (!miniMenuOpened) {
      if (!menu$1.url) {
        setSelected(null);
      }
    }
    setAnchorEl(null);
  };
  React.useMemo(() => {
    if (selected === selectedItems) {
      if (level === 1) {
        setOpen(true);
      }
    } else {
      if (level === selectedLevel) {
        setOpen(false);
        if (!miniMenuOpened && !drawerOpen && !selected) {
          setSelected(null);
        }
        if (drawerOpen) {
          setSelected(null);
        }
      }
    }
  }, [selectedItems, level, selected, miniMenuOpened, drawerOpen, selectedLevel]);
  const {
    pathname
  } = reactRouterDom.useLocation();
  React.useEffect(() => {
    if (pathname === menu$1.url) {
      setSelected(menu$1.id);
    }
  }, [pathname]);
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
    if (menu$1.children) {
      menu$1.children.forEach((item) => {
        if (item.children?.length) {
          checkOpenForParent(item.children, menu$1.id);
        }
        if (pathname && pathname.includes("product-details")) {
          if (item.url && item.url.includes("product-details")) {
            setSelected(menu$1.id);
            setOpen(true);
          }
        }
        if (item.url === pathname) {
          setSelected(menu$1.id);
          setOpen(true);
        }
      });
    }
  }, [pathname, menu$1.children]);
  React.useEffect(() => {
    if (menu$1.url === pathname && menu$1.id) {
      index.dispatch(menu.activeItem([menu$1.id]));
      setSelected(menu$1.id);
      setAnchorEl(null);
      setOpen(true);
    }
  }, [pathname, menu$1, index.dispatch]);
  const navCollapse = menu$1.children?.map((item) => {
    switch (item.type) {
      case "collapse":
        return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(NavCollapse, { setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, menu: item, level: level + 1, parentId }, item.id);
      case "item":
        return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(NavItem, { item, level: level + 1 }, item.id);
      default:
        return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h6", color: "error", align: "center", children: "Fix - Collapse or Item" }, item.id);
    }
  });
  const isSelected = selected === menu$1.id;
  const borderIcon = level === 1 ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.BorderOutlined, { style: {
    fontSize: "1rem"
  } }) : false;
  const Icon = menu$1.icon;
  const menuIcon = menu$1.icon ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Icon, { style: {
    fontSize: drawerOpen ? "1rem" : "1.25rem"
  } }) : borderIcon;
  const textColor = theme.palette.mode === config.ThemeMode.DARK ? "grey.400" : "text.primary";
  const iconSelectedColor = theme.palette.mode === config.ThemeMode.DARK && drawerOpen ? theme.palette.text.primary : theme.palette.primary.main;
  const popperId = miniMenuOpened ? `collapse-pop-${menu$1.id}` : void 0;
  const FlexBox = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%"
  };
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(emotionReactJsxRuntime_browser_esm.Fragment, { children: menuOrientation === config.MenuOrientation.VERTICAL || downLG ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(emotionReactJsxRuntime_browser_esm.Fragment, { children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ListItemButton, { disableRipple: true, selected: selected === menu$1.id, ...!drawerOpen && {
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
      menuIcon && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { onClick: handlerIconLink, sx: {
        minWidth: 28,
        color: selected === menu$1.id ? "primary.main" : textColor,
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
        ...!drawerOpen && selected === menu$1.id && {
          bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "primary.900" : "primary.lighter",
          "&:hover": {
            bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "primary.darker" : "primary.lighter"
          }
        }
      }, children: menuIcon }),
      (drawerOpen || !drawerOpen && level !== 1) && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemText, { primary: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h6", color: selected === menu$1.id ? "primary" : textColor, children: menu$1.title }), secondary: menu$1.caption && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "caption", color: "secondary", children: menu$1.caption }) }),
      (drawerOpen || !drawerOpen && level !== 1) && (miniMenuOpened || open ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.UpOutlined, { style: {
        fontSize: "0.625rem",
        marginLeft: 1,
        color: theme.palette.primary.main
      } }) : /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.DownOutlined, { style: {
        fontSize: "0.625rem",
        marginLeft: 1
      } })),
      !drawerOpen && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(PopperStyled, { open: miniMenuOpened, anchorEl, placement: "right-start", style: {
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
      }) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Transitions, { in: miniMenuOpened, ...TransitionProps, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Paper, { sx: {
        overflow: "hidden",
        mt: 1.5,
        boxShadow: theme.customShadows.z1,
        backgroundImage: "none",
        border: `1px solid ${theme.palette.divider}`
      }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ClickAwayListener, { onClickAway: handleClose, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(SimpleBar, { sx: {
        overflowX: "hidden",
        overflowY: "auto",
        maxHeight: "calc(100vh - 170px)"
      }, children: navCollapse }) }) }) }) })
    ] }),
    drawerOpen && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Collapse, { in: open, timeout: "auto", unmountOnExit: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.List, { sx: {
      p: 0
    }, children: navCollapse }) })
  ] }) : /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(emotionReactJsxRuntime_browser_esm.Fragment, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ListItemButton, { id: `boundary-${popperId}`, disableRipple: true, selected: isSelected, onMouseEnter: handleHover, onMouseLeave: handleClose, onClick: handleHover, "aria-describedby": popperId, sx: {
    "&.Mui-selected": {
      bgcolor: "transparent"
    }
  }, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { onClick: handlerIconLink, sx: FlexBox, children: [
      menuIcon && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { sx: {
        my: "auto",
        minWidth: !menu$1.icon ? 18 : 36,
        color: theme.palette.secondary.dark
      }, children: menuIcon }),
      !menuIcon && level !== 1 && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { sx: {
        my: "auto",
        minWidth: !menu$1.icon ? 18 : 36,
        bgcolor: "transparent",
        "&:hover": {
          bgcolor: "transparent"
        }
      }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Dot, { size: 4, color: isSelected ? "primary" : "secondary" }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemText, { primary: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "body1", color: "inherit", sx: {
        my: "auto"
      }, children: menu$1.title }) }),
      miniMenuOpened ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.RightOutlined, {}) : /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.DownOutlined, {})
    ] }),
    anchorEl && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(PopperStyled, { id: popperId, open: miniMenuOpened, anchorEl, placement: "right-start", style: {
      zIndex: 2001
    }, modifiers: [{
      name: "offset",
      options: {
        offset: [-10, 0]
      }
    }], children: ({
      TransitionProps
    }) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Transitions, { in: miniMenuOpened, ...TransitionProps, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Paper, { sx: {
      overflow: "hidden",
      mt: 1.5,
      py: 0.5,
      boxShadow: theme.shadows[8],
      backgroundImage: "none"
    }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ClickAwayListener, { onClickAway: handleClose, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(SimpleBar, { sx: {
      overflowX: "hidden",
      overflowY: "auto",
      maxHeight: "calc(100vh - 170px)"
    }, children: navCollapse }) }) }) }) })
  ] }) }) });
};
module.exports = NavCollapse;
//# sourceMappingURL=NavCollapse.cjs.map
