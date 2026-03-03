"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const reactRouterDom = require("react-router-dom");
const styles = require("@mui/material/styles");
const AppBar = require("@mui/material/AppBar");
const useMediaQuery = require("@mui/material/useMediaQuery");
require("@mui/material/useScrollTrigger");
const Box = require("@mui/material/Box");
const Button = require("@mui/material/Button");
const Container = require("@mui/material/Container");
const Drawer = require("@mui/material/Drawer");
const List = require("@mui/material/List");
const ListItem = require("@mui/material/ListItem");
const ListItemButton = require("@mui/material/ListItemButton");
const ListItemText = require("@mui/material/ListItemText");
const Collapse = require("@mui/material/Collapse");
const Stack = require("@mui/material/Stack");
const Toolbar = require("@mui/material/Toolbar");
const Typography = require("@mui/material/Typography");
const ArrowDropDownIcon = require("@mui/icons-material/ArrowDropDown");
const ExpandMoreIcon = require("@mui/icons-material/ExpandMore");
const ExpandLessIcon = require("@mui/icons-material/ExpandLess");
const Divider = require("@mui/material/Divider");
const Paper = require("@mui/material/Paper");
const index = require("../../Logo/index.cjs");
const IconButton = require("../../extended/IconButton.cjs");
const MenuOutlined = require("@ant-design/icons/MenuOutlined");
const framerMotion = require("framer-motion");
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
const StyledRouterLink = styles.styled(reactRouterDom.Link)(({
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
  const theme = styles.useTheme();
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
  const drawer = /* @__PURE__ */ jsxRuntime.jsxs(Box, { sx: {
    textAlign: "center"
  }, children: [
    /* @__PURE__ */ jsxRuntime.jsx(Typography, { sx: {
      textAlign: "left",
      display: "inline-block"
    }, children: /* @__PURE__ */ jsxRuntime.jsx(index.Logo, { reverse: true, to: "/" }) }),
    /* @__PURE__ */ jsxRuntime.jsx(List, { children: navItems.map((item) => item.children ? /* @__PURE__ */ jsxRuntime.jsxs(React__namespace.Fragment, { children: [
      /* @__PURE__ */ jsxRuntime.jsxs(ListItemButton, { onClick: () => handleToggle(item.label), children: [
        /* @__PURE__ */ jsxRuntime.jsx(ListItemText, { primary: item.label }),
        openItems[item.label] ? /* @__PURE__ */ jsxRuntime.jsx(ExpandLessIcon, { fontSize: "small" }) : /* @__PURE__ */ jsxRuntime.jsx(ExpandMoreIcon, { fontSize: "small" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx(Collapse, { in: openItems[item.label], timeout: "auto", unmountOnExit: true, children: /* @__PURE__ */ jsxRuntime.jsx(List, { component: "div", disablePadding: true, children: item.children.items.map((child) => /* @__PURE__ */ jsxRuntime.jsx(ListItem, { disablePadding: true, children: /* @__PURE__ */ jsxRuntime.jsx(
        ListItemButton,
        {
          href: child.path,
          onClick: handleDrawerToggle,
          sx: {
            pl: 4
          },
          children: /* @__PURE__ */ jsxRuntime.jsx(ListItemText, { primary: child.label })
        }
      ) }, child.label)) }) })
    ] }, item.label) : /* @__PURE__ */ jsxRuntime.jsx(ListItem, { disablePadding: true, children: /* @__PURE__ */ jsxRuntime.jsx(
      ListItemButton,
      {
        href: item.path,
        onClick: handleDrawerToggle,
        children: /* @__PURE__ */ jsxRuntime.jsx(ListItemText, { primary: item.label })
      }
    ) }, item.label)) })
  ] });
  return (
    // <ElevationScroll>
    /* @__PURE__ */ jsxRuntime.jsx(AppBar, { sx: {
      bgcolor: theme.palette.background.paper,
      color: "text.primary",
      boxShadow: "none",
      borderBottom: `1px solid ${theme.palette.grey[200]}`
    }, component: "nav", elevation: 0, position: "sticky", children: /* @__PURE__ */ jsxRuntime.jsx(Container, { disableGutters: downMD, children: /* @__PURE__ */ jsxRuntime.jsxs(Toolbar, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(Stack, { direction: "row", sx: {
        flexGrow: 1,
        display: {
          xs: "none",
          md: "block"
        }
      }, alignItems: "center", children: /* @__PURE__ */ jsxRuntime.jsx(Typography, { sx: {
        textAlign: "left",
        display: "inline-block"
      }, children: /* @__PURE__ */ jsxRuntime.jsx(index.Logo, { reverse: true, to: "/" }) }) }),
      /* @__PURE__ */ jsxRuntime.jsx(Stack, { direction: "row", sx: {
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
      }, spacing: 2, children: !isMobile && /* @__PURE__ */ jsxRuntime.jsxs(Box, { sx: {
        display: "flex",
        gap: 2
      }, onMouseLeave: () => setHoveredItem(null), children: [
        navItems.map((item) => {
          const isActive = hoveredItem?.label === item.label;
          const hasDropdown = item.children && !item.customSubHeader;
          const hasSubHeader = !!item.customSubHeader;
          return /* @__PURE__ */ jsxRuntime.jsxs(Box, { sx: {
            display: "flex",
            alignItems: "center",
            position: "relative"
          }, children: [
            /* @__PURE__ */ jsxRuntime.jsxs(
              StyledRouterLink,
              {
                to: item.path,
                onMouseEnter: () => setHoveredItem(item),
                children: [
                  item.label,
                  hasDropdown && /* @__PURE__ */ jsxRuntime.jsx(ArrowDropDownIcon, {})
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsxs(framerMotion.AnimatePresence, { children: [
              isActive && hasSubHeader && /* @__PURE__ */ jsxRuntime.jsx(framerMotion.motion.div, { initial: {
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
              }, children: /* @__PURE__ */ jsxRuntime.jsx(Box, { sx: {
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: 3
              }, children: item.customSubHeader }) }, "subHeader"),
              isActive && hasDropdown && /* @__PURE__ */ jsxRuntime.jsx(framerMotion.motion.div, { initial: {
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
              }, children: /* @__PURE__ */ jsxRuntime.jsxs(Paper, { elevation: 2, sx: {
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: 3
              }, children: [
                item.children?.header && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntime.jsx(Typography, { variant: "subtitle2", sx: {
                    px: 2,
                    py: 1
                  }, children: item.children.header }),
                  /* @__PURE__ */ jsxRuntime.jsx(Divider, {})
                ] }),
                /* @__PURE__ */ jsxRuntime.jsx(Box, { sx: {
                  display: "flex",
                  flexDirection: "column",
                  px: 2
                }, children: item?.children?.items.map((child) => /* @__PURE__ */ jsxRuntime.jsx(
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
        /* @__PURE__ */ jsxRuntime.jsx(
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
      /* @__PURE__ */ jsxRuntime.jsxs(Box, { sx: {
        width: "100%",
        // alignItems: 'center',
        justifyContent: "space-between",
        display: {
          xs: "flex",
          md: "none"
        }
      }, children: [
        /* @__PURE__ */ jsxRuntime.jsx(Typography, { sx: {
          textAlign: "left",
          display: "inline-block"
        }, children: /* @__PURE__ */ jsxRuntime.jsx(index.Logo, { reverse: true, to: "/" }) }),
        /* @__PURE__ */ jsxRuntime.jsx(Stack, { direction: "row", spacing: 2, alignItems: "center", children: /* @__PURE__ */ jsxRuntime.jsx(IconButton, { color: "inherit", onClick: handleDrawerToggle, sx: {
          "&:hover": {
            bgcolor: "secondary.light"
          }
        }, children: /* @__PURE__ */ jsxRuntime.jsx(MenuOutlined, {}) }) }),
        isMobile && /* @__PURE__ */ jsxRuntime.jsx(Drawer, { anchor: "top", open: mobileOpen, onClose: handleDrawerToggle, sx: {
          "& .MuiDrawer-paper": {
            backgroundImage: "none"
          }
        }, children: /* @__PURE__ */ jsxRuntime.jsx(
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
