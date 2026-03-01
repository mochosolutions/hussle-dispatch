"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const reactRouterDom = require("react-router-dom");
const material = require("@mui/material");
const config = require("../../../config.cjs");
const IconButton = require("../../extended/IconButton.cjs");
const AnimateButton = require("../../extended/AnimateButton.cjs");
const index = require("../../Logo/index.cjs");
const icons = require("@ant-design/icons");
const config$1 = require("../../../types/config.cjs");
const useTheme = require("../../../node_modules/@mui/material/styles/useTheme.cjs");
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
function ElevationScroll({
  layout,
  children,
  window
}) {
  const theme = useTheme();
  const trigger = material.useScrollTrigger({
    disableHysteresis: true,
    threshold: 10,
    target: window ? window() : void 0
  });
  const backColorScroll = theme.palette.mode === config$1.ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[800];
  const backColor = layout !== "landing" ? backColorScroll : "transparent";
  return React__namespace.cloneElement(children, {
    style: {
      backgroundColor: trigger ? backColorScroll : backColor
    }
  });
}
const Header = ({
  handleDrawerOpen,
  layout = "landing",
  ...others
}) => {
  const theme = useTheme();
  const matchDownMd = material.useMediaQuery(theme.breakpoints.down("md"));
  const [drawerToggle, setDrawerToggle] = React.useState(false);
  const drawerToggler = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setDrawerToggle(open);
  };
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ElevationScroll, { layout, ...others, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(AppBar, { sx: {
    bgcolor: "transparent",
    color: theme.palette.text.primary,
    boxShadow: "none"
  }, className: "header", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Container, { disableGutters: matchDownMd, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Toolbar, { sx: {
    px: {
      xs: 1.5,
      md: 0,
      lg: 0
    },
    py: 2
  }, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Stack, { direction: "row", sx: {
      flexGrow: 1,
      display: {
        xs: "none",
        md: "block"
      }
    }, alignItems: "center", children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { component: "div", sx: {
        textAlign: "left",
        display: "inline-block"
      }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index.Logo, { reverse: true, to: "/" }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(
        material.Chip,
        {
          variant: "outlined",
          size: "small",
          color: "secondary",
          sx: {
            mt: 0.5,
            ml: 1,
            fontSize: "0.725rem",
            height: 20,
            "& .MuiChip-label": {
              px: 0.5
            }
          }
        }
      )
    ] }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Stack, { direction: "row", sx: {
      "& .header-link": {
        px: 1,
        "&:hover": {
          color: theme.palette.primary.main
        }
      },
      display: {
        xs: "none",
        md: "block"
      }
    }, spacing: 2, children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Link, { className: "header-link", color: "white", component: reactRouterDom.Link, to: "/login", target: "_blank", underline: "none", children: "Dashboard" }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Link, { className: "header-link", color: handleDrawerOpen ? "primary" : "white", component: reactRouterDom.Link, to: "/components-overview/buttons", underline: "none", children: "Components" }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Link, { className: "header-link", color: "white", href: "https://codedthemes.gitbook.io/mantis/", target: "_blank", underline: "none", children: "Documentation" }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { sx: {
        display: "inline-block"
      }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(AnimateButton, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Button, { component: material.Link, href: "https://mui.com/store/items/mantis-react-admin-dashboard-template/", disableElevation: true, color: "primary", variant: "contained", children: "Purchase Now" }) }) })
    ] }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { sx: {
      width: "100%",
      alignItems: "center",
      justifyContent: "space-between",
      display: {
        xs: "flex",
        md: "none"
      }
    }, children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { component: "div", sx: {
        textAlign: "left",
        display: "inline-block"
      }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index.Logo, { reverse: true, to: "/" }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Stack, { direction: "row", spacing: 2, children: [
        layout === "component" && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Button, { variant: "outlined", size: "small", color: "warning", component: reactRouterDom.Link, to: config.APP_DEFAULT_PATH, sx: {
          mt: 0.5,
          height: 28
        }, children: "Dashboard" }),
        layout !== "component" && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Button, { variant: "outlined", size: "small", color: "warning", component: reactRouterDom.Link, to: "/components-overview/buttons", sx: {
          mt: 0.5,
          height: 28
        }, children: "All Components" }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(IconButton, { color: "secondary", ...layout === "component" ? {
          onClick: handleDrawerOpen
        } : {
          onClick: drawerToggler(true)
        }, sx: {
          "&:hover": {
            bgcolor: theme.palette.mode === config$1.ThemeMode.DARK ? "secondary.lighter" : "secondary.dark"
          }
        }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.MenuOutlined, { style: {
          color: theme.palette.mode === config$1.ThemeMode.DARK ? "inherit" : theme.palette.grey[100]
        } }) })
      ] }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Drawer, { anchor: "top", open: drawerToggle, onClose: drawerToggler(false), sx: {
        "& .MuiDrawer-paper": {
          backgroundImage: "none"
        }
      }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { sx: {
        width: "auto",
        "& .MuiListItemIcon-root": {
          fontSize: "1rem",
          minWidth: 28
        }
      }, role: "presentation", onClick: drawerToggler(false), onKeyDown: drawerToggler(false), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.List, { children: [
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Link, { style: {
          textDecoration: "none"
        }, href: "/login", target: "_blank", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ListItemButton, { component: "span", children: [
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.LineOutlined, {}) }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemText, { primary: "Dashboard", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } })
        ] }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Link, { style: {
          textDecoration: "none"
        }, href: "/components-overview/buttons", target: "_blank", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ListItemButton, { component: "span", children: [
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.LineOutlined, {}) }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemText, { primary: "All Components", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } })
        ] }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Link, { style: {
          textDecoration: "none"
        }, href: "https://github.com/codedthemes/mantis-free-react-admin-template", target: "_blank", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ListItemButton, { component: "span", children: [
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.LineOutlined, {}) }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemText, { primary: "Free Version", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } })
        ] }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Link, { style: {
          textDecoration: "none"
        }, href: "https://codedthemes.gitbook.io/mantis/", target: "_blank", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ListItemButton, { component: "span", children: [
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.LineOutlined, {}) }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemText, { primary: "Documentation", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } })
        ] }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Link, { style: {
          textDecoration: "none"
        }, href: "https://codedthemes.support-hub.io/", target: "_blank", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ListItemButton, { component: "span", children: [
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.LineOutlined, {}) }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemText, { primary: "Support", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } })
        ] }) }),
        /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Link, { style: {
          textDecoration: "none"
        }, href: "https://mui.com/store/items/mantis-react-admin-dashboard-template/", target: "_blank", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ListItemButton, { component: "span", children: [
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemIcon, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.LineOutlined, {}) }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ListItemText, { primary: "Purchase Now", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Chip, { color: "primary", label: "v1.0", size: "small" })
        ] }) })
      ] }) }) })
    ] })
  ] }) }) }) });
};
module.exports = Header;
//# sourceMappingURL=Header.cjs.map
