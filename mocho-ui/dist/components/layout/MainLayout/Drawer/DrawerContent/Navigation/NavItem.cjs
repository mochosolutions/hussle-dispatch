"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const reactRouterDom = require("react-router-dom");
const material = require("@mui/material");
const Dot = require("../../../../../extended/Dot.cjs");
const useConfig = require("../../../../../../hooks/useConfig.cjs");
const index = require("../../../../../../store/index.cjs");
const menu = require("../../../../../../store/reducers/menu.cjs");
const config = require("../../../../../../types/config.cjs");
const useTheme = require("../../../../../../node_modules/@mui/material/styles/useTheme.cjs");
const NavItem = ({
  item,
  level
}) => {
  const theme = useTheme();
  const menu$1 = index.useSelector((state) => state.menu);
  const matchDownLg = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    drawerOpen,
    openItem
  } = menu$1;
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig.useConfig();
  let itemTarget = "_self";
  if (item.target) {
    itemTarget = "_blank";
  }
  let listItemProps = {
    component: React.forwardRef((props, ref) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(reactRouterDom.Link, { ...props, to: item.url, target: itemTarget, ref }))
  };
  if (item?.external) {
    listItemProps = {
      component: "a",
      href: item.url,
      target: itemTarget
    };
  }
  const Icon = item.icon;
  const itemIcon = item.icon ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Icon, { style: {
    fontSize: drawerOpen ? "1rem" : "1.25rem"
  } }) : false;
  const isSelected = openItem.findIndex((id) => id === item.id) > -1;
  const {
    pathname
  } = reactRouterDom.useLocation();
  React.useEffect(() => {
    if (!item.id) return;
    if (pathname && pathname.includes("product-details")) {
      if (item.url && item.url.includes("product-details")) {
        index.dispatch(menu.activeItem([item.id]));
      }
    }
    if (pathname && pathname.includes("kanban")) {
      if (item.url && item.url.includes("kanban")) {
        index.dispatch(menu.activeItem([item.id]));
      }
    }
    if (pathname === item.url) {
      index.dispatch(menu.activeItem([item.id]));
    }
  }, [pathname, item.id, item.url, index.dispatch]);
  const textColor = theme.palette.mode === config.ThemeMode.DARK ? "grey.400" : "text.primary";
  const iconSelectedColor = theme.palette.mode === config.ThemeMode.DARK && drawerOpen ? "text.primary" : "primary.main";
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(emotionReactJsxRuntime_browser_esm.Fragment, { children: menuOrientation === config.MenuOrientation.VERTICAL || downLG ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ListItemButton, { ...listItemProps, disabled: item.disabled, selected: isSelected, sx: {
    zIndex: 1201,
    pl: drawerOpen ? `${level * 28}px` : 1.5,
    py: !drawerOpen && level === 1 ? 1.25 : 1,
    ...drawerOpen && {
      "&:hover": {
        bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "divider" : "primary.lighter"
      },
      "&.Mui-selected": {
        bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "divider" : "primary.lighter",
        borderRight: `2px solid ${theme.palette.primary.main}`,
        color: iconSelectedColor,
        "&:hover": {
          color: iconSelectedColor,
          bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "divider" : "primary.lighter"
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
  }, ...matchDownLg && {
    onClick: () => index.dispatch()
  }, children: [
    itemIcon && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { sx: {
      minWidth: 28,
      color: isSelected ? iconSelectedColor : textColor,
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
      ...!drawerOpen && isSelected && {
        bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "primary.900" : "primary.lighter",
        "&:hover": {
          bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "primary.darker" : "primary.lighter"
        }
      }
    }, children: itemIcon }),
    (drawerOpen || !drawerOpen && level !== 1) && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemText, { primary: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h6", sx: {
      color: isSelected ? iconSelectedColor : textColor
    }, children: item.title }) }),
    (drawerOpen || !drawerOpen && level !== 1) && item.chip && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Chip, { color: item.chip.color, variant: item.chip.variant, size: item.chip.size, label: item.chip.label, avatar: item.chip.avatar && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Avatar, { children: item.chip.avatar }) })
  ] }) : /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ListItemButton, { ...listItemProps, disabled: item.disabled, selected: isSelected, sx: {
    zIndex: 1201,
    ...drawerOpen && {
      "&:hover": {
        bgcolor: "transparent"
      },
      "&.Mui-selected": {
        bgcolor: "transparent",
        color: iconSelectedColor,
        "&:hover": {
          color: iconSelectedColor,
          bgcolor: "transparent"
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
    itemIcon && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { sx: {
      minWidth: 36,
      ...!drawerOpen && {
        borderRadius: 1.5,
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "flex-start",
        "&:hover": {
          bgcolor: "transparent"
        }
      },
      ...!drawerOpen && isSelected && {
        bgcolor: "transparent",
        "&:hover": {
          bgcolor: "transparent"
        }
      }
    }, children: itemIcon }),
    !itemIcon && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { sx: {
      color: isSelected ? "primary.main" : "secondary.main",
      ...!drawerOpen && {
        borderRadius: 1.5,
        alignItems: "center",
        justifyContent: "flex-start",
        "&:hover": {
          bgcolor: "transparent"
        }
      },
      ...!drawerOpen && isSelected && {
        bgcolor: "transparent",
        "&:hover": {
          bgcolor: "transparent"
        }
      }
    }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Dot, { size: 4, color: isSelected ? "primary" : "secondary" }) }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemText, { primary: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h6", color: "inherit", children: item.title }) }),
    (drawerOpen || !drawerOpen && level !== 1) && item.chip && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Chip, { color: item.chip.color, variant: item.chip.variant, size: item.chip.size, label: item.chip.label, avatar: item.chip.avatar && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Avatar, { children: item.chip.avatar }) })
  ] }) });
};
module.exports = NavItem;
//# sourceMappingURL=NavItem.cjs.map
