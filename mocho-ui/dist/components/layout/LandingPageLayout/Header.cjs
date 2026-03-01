"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const reactRouterDom = require("react-router-dom");
const ArrowDropDown = require("../../../_virtual/ArrowDropDown.cjs");
const ExpandMore = require("../../../_virtual/ExpandMore.cjs");
const ExpandLess = require("../../../_virtual/ExpandLess.cjs");
const index = require("../../Logo/index.cjs");
const IconButton = require("../../extended/IconButton.cjs");
const MenuOutlined = require("../../../_virtual/MenuOutlined.cjs");
const framerMotion = require("framer-motion");
const useTheme = require("../../../node_modules/@mui/material/styles/useTheme.cjs");
const useMediaQuery = require("../../../node_modules/@mui/system/esm/useMediaQuery/useMediaQuery.cjs");
const Typography = require("../../../node_modules/@mui/material/Typography/Typography.cjs");
const ListItemButton = require("../../../node_modules/@mui/material/ListItemButton/ListItemButton.cjs");
const ListItemText = require("../../../node_modules/@mui/material/ListItemText/ListItemText.cjs");
const Collapse = require("../../../node_modules/@mui/material/Collapse/Collapse.cjs");
const List = require("../../../node_modules/@mui/material/List/List.cjs");
const ListItem = require("../../../node_modules/@mui/material/ListItem/ListItem.cjs");
const Box = require("../../../node_modules/@mui/material/Box/Box.cjs");
const Container = require("../../../node_modules/@mui/material/Container/Container.cjs");
const Stack = require("../../../node_modules/@mui/material/Stack/Stack.cjs");
const styled = require("../../../node_modules/@mui/material/styles/styled.cjs");
const Paper = require("../../../node_modules/@mui/material/Paper/Paper.cjs");
const Divider = require("../../../node_modules/@mui/material/Divider/Divider.cjs");
const Button = require("../../../node_modules/@mui/material/Button/Button.cjs");
const Drawer = require("../../../node_modules/@mui/material/Drawer/Drawer.cjs");
const Toolbar = require("../../../node_modules/@mui/material/Toolbar/Toolbar.cjs");
const AppBar = require("../../../node_modules/@mui/material/AppBar/AppBar.cjs");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const React__namespace = /* @__PURE__ */ _interopNamespaceDefault(React);
const navItems = [{
  label: "Job Seekers",
  path: "/job-seekers"
}, {
  label: "Employers",
  path: "/employers"
}, {
  label: "About",
  path: "/about",
  children: {
    header: "Company Info",
    items: [{
      label: "About",
      path: "/about"
    }, {
      label: "Careers",
      path: "/careers"
    }]
  }
}, {
  label: "Browse Jobs",
  path: "/jobs"
}];
const StyledRouterLink = styled.default(reactRouterDom.Link)(({
  theme
}) => ({
  display: "flex",
  alignItems: "center",
  fontWeight: "bold",
  textDecoration: "none",
  color: theme.palette.grey[700],
  "&:hover": {
    backgroundColor: "transparent"
  }
}));
function Header() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerToggle, setDrawerToggle] = React.useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState(null);
  const [openItems, setOpenItems] = React.useState({});
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleToggle = (label) => {
    setOpenItems((prev) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };
  const drawer = /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Box, { sx: {
    textAlign: "center"
  }, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Typography.default, { sx: {
      textAlign: "left",
      display: "inline-block"
    }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index.Logo, { reverse: true, to: "/" }) }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(List, { children: navItems.map((item) => item.children ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(React__namespace.Fragment, { children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(ListItemButton.default, { onClick: () => handleToggle(item.label), children: [
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ListItemText, { primary: item.label }),
        openItems[item.label] ? /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ExpandLess, { fontSize: "small" }) : /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ExpandMore, { fontSize: "small" })
      ] }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Collapse, { in: openItems[item.label], timeout: "auto", unmountOnExit: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(List, { component: "div", disablePadding: true, children: item.children.items.map((child) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ListItem.default, { disablePadding: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(
        ListItemButton.default,
        {
          href: child.path,
          onClick: handleDrawerToggle,
          sx: {
            pl: 4
          },
          children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ListItemText, { primary: child.label })
        }
      ) }, child.label)) }) })
    ] }, item.label) : /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ListItem.default, { disablePadding: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(
      ListItemButton.default,
      {
        href: item.path,
        onClick: handleDrawerToggle,
        children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ListItemText, { primary: item.label })
      }
    ) }, item.label)) })
  ] });
  return (
    // <ElevationScroll>
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(AppBar, { sx: {
      bgcolor: theme.palette.background.paper,
      color: "text.primary",
      boxShadow: "none",
      borderBottom: `1px solid ${theme.palette.grey[200]}`
    }, component: "nav", elevation: 0, position: "sticky", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Container, { disableGutters: downMD, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Toolbar, { children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Stack, { direction: "row", sx: {
        flexGrow: 1,
        display: {
          xs: "none",
          md: "block"
        }
      }, alignItems: "center", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Typography.default, { sx: {
        textAlign: "left",
        display: "inline-block"
      }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index.Logo, { reverse: true, to: "/" }) }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Stack, { direction: "row", sx: {
        "& .header-link": {
          px: 1,
          "&:hover": {
            color: "primary.main"
          }
        },
        display: {
          xs: "none",
          md: "block"
        }
      }, spacing: 2, children: !isMobile && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Box, { sx: {
        display: "flex",
        gap: 2
      }, onMouseLeave: () => setHoveredItem(null), children: [
        navItems.map((item) => {
          const isActive = hoveredItem?.label === item.label;
          const hasDropdown = item.children && !item.customSubHeader;
          const hasSubHeader = !!item.customSubHeader;
          return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Box, { sx: {
            display: "flex",
            alignItems: "center",
            position: "relative"
          }, children: [
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(
              StyledRouterLink,
              {
                to: item.path,
                onMouseEnter: () => setHoveredItem(item),
                children: [
                  item.label,
                  hasDropdown && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ArrowDropDown, {})
                ]
              }
            ),
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(framerMotion.AnimatePresence, { children: [
              isActive && hasSubHeader && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(framerMotion.motion.div, { initial: {
                opacity: 0,
                y: 10
              }, animate: {
                opacity: 1,
                y: 0
              }, exit: {
                opacity: 0,
                y: 10
              }, transition: {
                duration: 0.2
              }, style: {
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: theme.zIndex.appBar + 1,
                minWidth: 250
              }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Box, { sx: {
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: 3
              }, children: item.customSubHeader }) }, "subHeader"),
              isActive && hasDropdown && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(framerMotion.motion.div, { initial: {
                opacity: 0,
                y: 10
              }, animate: {
                opacity: 1,
                y: 0
              }, exit: {
                opacity: 0,
                y: 10
              }, transition: {
                duration: 0.2
              }, style: {
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: theme.zIndex.appBar + 1,
                minWidth: 250
              }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Paper, { elevation: 2, sx: {
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: 3
              }, children: [
                item.children?.header && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(emotionReactJsxRuntime_browser_esm.Fragment, { children: [
                  /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Typography.default, { variant: "subtitle2", sx: {
                    px: 2,
                    py: 1
                  }, children: item.children.header }),
                  /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Divider, {})
                ] }),
                /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Box, { sx: {
                  display: "flex",
                  flexDirection: "column",
                  px: 2
                }, children: item?.children?.items.map((child) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(
                  Button,
                  {
                    href: child.path,
                    onClick: () => setHoveredItem(null),
                    sx: {
                      justifyContent: "flex-start",
                      py: 1
                    },
                    children: child.label
                  },
                  child.label
                )) })
              ] }) }, "dropdown")
            ] })
          ] }, item.label);
        }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(
          Button,
          {
            variant: "contained",
            href: "/login",
            size: "large",
            sx: {
              color: theme.palette.primary.contrastText,
              borderColor: theme.palette.primary.main,
              ":hover": {
                // backgroundColor: theme.palette.primary.main,
                // color: 'white',
              }
            },
            children: "Sign Up"
          }
        )
      ] }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Box, { sx: {
        width: "100%",
        // alignItems: 'center',
        justifyContent: "space-between",
        display: {
          xs: "flex",
          md: "none"
        }
      }, children: [
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Typography.default, { sx: {
          textAlign: "left",
          display: "inline-block"
        }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index.Logo, { reverse: true, to: "/" }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Stack, { direction: "row", spacing: 2, alignItems: "center", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(IconButton, { color: "inherit", onClick: handleDrawerToggle, sx: {
          "&:hover": {
            bgcolor: "secondary.light"
          }
        }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(MenuOutlined, {}) }) }),
        isMobile && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Drawer.default, { anchor: "top", open: mobileOpen, onClose: handleDrawerToggle, sx: {
          "& .MuiDrawer-paper": {
            backgroundImage: "none"
          }
        }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(
          Box,
          {
            sx: {
              width: "auto",
              "& .MuiListItemIcon-root": {
                fontSize: "1rem",
                minWidth: 28
              }
            },
            role: "presentation",
            children: drawer
          }
        ) })
      ] })
    ] }) }) })
  );
}
module.exports = Header;
//# sourceMappingURL=Header.cjs.map
