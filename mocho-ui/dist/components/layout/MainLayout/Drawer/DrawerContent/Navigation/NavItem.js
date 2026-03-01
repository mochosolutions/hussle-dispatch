import { jsx, jsxs, Fragment } from "../../../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { forwardRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMediaQuery, ListItemIcon, ListItemText, Typography, Chip, Avatar, ListItemButton } from "@mui/material";
import Dot from "../../../../../extended/Dot.js";
import { useConfig } from "../../../../../../hooks/useConfig.js";
import { useSelector, dispatch } from "../../../../../../store/index.js";
import { activeItem } from "../../../../../../store/reducers/menu.js";
import { ThemeMode, MenuOrientation } from "../../../../../../types/config.js";
import useTheme from "../../../../../../node_modules/@mui/material/styles/useTheme.js";
const NavItem = ({
  item,
  level
}) => {
  const theme = useTheme();
  const menu = useSelector((state) => state.menu);
  const matchDownLg = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    drawerOpen,
    openItem
  } = menu;
  const downLG = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig();
  let itemTarget = "_self";
  if (item.target) {
    itemTarget = "_blank";
  }
  let listItemProps = {
    component: forwardRef((props, ref) => /* @__PURE__ */ jsx(Link, { ...props, to: item.url, target: itemTarget, ref }))
  };
  if (item?.external) {
    listItemProps = {
      component: "a",
      href: item.url,
      target: itemTarget
    };
  }
  const Icon = item.icon;
  const itemIcon = item.icon ? /* @__PURE__ */ jsx(Icon, { style: {
    fontSize: drawerOpen ? "1rem" : "1.25rem"
  } }) : false;
  const isSelected = openItem.findIndex((id) => id === item.id) > -1;
  const {
    pathname
  } = useLocation();
  useEffect(() => {
    if (!item.id) return;
    if (pathname && pathname.includes("product-details")) {
      if (item.url && item.url.includes("product-details")) {
        dispatch(activeItem([item.id]));
      }
    }
    if (pathname && pathname.includes("kanban")) {
      if (item.url && item.url.includes("kanban")) {
        dispatch(activeItem([item.id]));
      }
    }
    if (pathname === item.url) {
      dispatch(activeItem([item.id]));
    }
  }, [pathname, item.id, item.url, dispatch]);
  const textColor = theme.palette.mode === ThemeMode.DARK ? "grey.400" : "text.primary";
  const iconSelectedColor = theme.palette.mode === ThemeMode.DARK && drawerOpen ? "text.primary" : "primary.main";
  return /* @__PURE__ */ jsx(Fragment, { children: menuOrientation === MenuOrientation.VERTICAL || downLG ? /* @__PURE__ */ jsxs(ListItemButton, { ...listItemProps, disabled: item.disabled, selected: isSelected, sx: {
    zIndex: 1201,
    pl: drawerOpen ? `${level * 28}px` : 1.5,
    py: !drawerOpen && level === 1 ? 1.25 : 1,
    ...drawerOpen && {
      "&:hover": {
        bgcolor: theme.palette.mode === ThemeMode.DARK ? "divider" : "primary.lighter"
      },
      "&.Mui-selected": {
        bgcolor: theme.palette.mode === ThemeMode.DARK ? "divider" : "primary.lighter",
        borderRight: `2px solid ${theme.palette.primary.main}`,
        color: iconSelectedColor,
        "&:hover": {
          color: iconSelectedColor,
          bgcolor: theme.palette.mode === ThemeMode.DARK ? "divider" : "primary.lighter"
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
    onClick: () => dispatch()
  }, children: [
    itemIcon && /* @__PURE__ */ jsx(ListItemIcon, { sx: {
      minWidth: 28,
      color: isSelected ? iconSelectedColor : textColor,
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
      ...!drawerOpen && isSelected && {
        bgcolor: theme.palette.mode === ThemeMode.DARK ? "primary.900" : "primary.lighter",
        "&:hover": {
          bgcolor: theme.palette.mode === ThemeMode.DARK ? "primary.darker" : "primary.lighter"
        }
      }
    }, children: itemIcon }),
    (drawerOpen || !drawerOpen && level !== 1) && /* @__PURE__ */ jsx(ListItemText, { primary: /* @__PURE__ */ jsx(Typography, { variant: "h6", sx: {
      color: isSelected ? iconSelectedColor : textColor
    }, children: item.title }) }),
    (drawerOpen || !drawerOpen && level !== 1) && item.chip && /* @__PURE__ */ jsx(Chip, { color: item.chip.color, variant: item.chip.variant, size: item.chip.size, label: item.chip.label, avatar: item.chip.avatar && /* @__PURE__ */ jsx(Avatar, { children: item.chip.avatar }) })
  ] }) : /* @__PURE__ */ jsxs(ListItemButton, { ...listItemProps, disabled: item.disabled, selected: isSelected, sx: {
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
    itemIcon && /* @__PURE__ */ jsx(ListItemIcon, { sx: {
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
    !itemIcon && /* @__PURE__ */ jsx(ListItemIcon, { sx: {
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
    }, children: /* @__PURE__ */ jsx(Dot, { size: 4, color: isSelected ? "primary" : "secondary" }) }),
    /* @__PURE__ */ jsx(ListItemText, { primary: /* @__PURE__ */ jsx(Typography, { variant: "h6", color: "inherit", children: item.title }) }),
    (drawerOpen || !drawerOpen && level !== 1) && item.chip && /* @__PURE__ */ jsx(Chip, { color: item.chip.color, variant: item.chip.variant, size: item.chip.size, label: item.chip.label, avatar: item.chip.avatar && /* @__PURE__ */ jsx(Avatar, { children: item.chip.avatar }) })
  ] }) });
};
export {
  NavItem as default
};
//# sourceMappingURL=NavItem.js.map
