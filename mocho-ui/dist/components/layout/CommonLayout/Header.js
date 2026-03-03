import { jsx, jsxs } from "@emotion/react/jsx-runtime";
import * as React from "react";
import { useState } from "react";
import { Link as Link$1 } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery, Container, Toolbar, Stack, Typography, Chip, Link, Box, Button, Drawer, List, ListItemButton, ListItemIcon, ListItemText, useScrollTrigger } from "@mui/material";
import { APP_DEFAULT_PATH } from "../../../config.js";
import IconButton from "../../extended/IconButton.js";
import AnimateButton from "../../extended/AnimateButton.js";
import { Logo } from "../../Logo/index.js";
import { MenuOutlined, LineOutlined } from "@ant-design/icons";
import { ThemeMode } from "../../../types/config.js";
function ElevationScroll({
  layout,
  children,
  window
}) {
  const theme = useTheme();
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 10,
    target: window ? window() : void 0
  });
  const backColorScroll = theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[50] : theme.palette.grey[800];
  const backColor = layout !== "landing" ? backColorScroll : "transparent";
  return React.cloneElement(children, {
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
  const matchDownMd = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerToggle, setDrawerToggle] = useState(false);
  const drawerToggler = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setDrawerToggle(open);
  };
  return /* @__PURE__ */ jsx(ElevationScroll, { layout, ...others, children: /* @__PURE__ */ jsx(AppBar, { sx: {
    bgcolor: "transparent",
    color: theme.palette.text.primary,
    boxShadow: "none"
  }, className: "header", children: /* @__PURE__ */ jsx(Container, { disableGutters: matchDownMd, children: /* @__PURE__ */ jsxs(Toolbar, { sx: {
    px: {
      xs: 1.5,
      md: 0,
      lg: 0
    },
    py: 2
  }, children: [
    /* @__PURE__ */ jsxs(Stack, { direction: "row", sx: {
      flexGrow: 1,
      display: {
        xs: "none",
        md: "block"
      }
    }, alignItems: "center", children: [
      /* @__PURE__ */ jsx(Typography, { component: "div", sx: {
        textAlign: "left",
        display: "inline-block"
      }, children: /* @__PURE__ */ jsx(Logo, { reverse: true, to: "/" }) }),
      /* @__PURE__ */ jsx(
        Chip,
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
    /* @__PURE__ */ jsxs(Stack, { direction: "row", sx: {
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
      /* @__PURE__ */ jsx(Link, { className: "header-link", color: "white", component: Link$1, to: "/login", target: "_blank", underline: "none", children: "Dashboard" }),
      /* @__PURE__ */ jsx(Link, { className: "header-link", color: handleDrawerOpen ? "primary" : "white", component: Link$1, to: "/components-overview/buttons", underline: "none", children: "Components" }),
      /* @__PURE__ */ jsx(Link, { className: "header-link", color: "white", href: "https://codedthemes.gitbook.io/mantis/", target: "_blank", underline: "none", children: "Documentation" }),
      /* @__PURE__ */ jsx(Box, { sx: {
        display: "inline-block"
      }, children: /* @__PURE__ */ jsx(AnimateButton, { children: /* @__PURE__ */ jsx(Button, { component: Link, href: "https://mui.com/store/items/mantis-react-admin-dashboard-template/", disableElevation: true, color: "primary", variant: "contained", children: "Purchase Now" }) }) })
    ] }),
    /* @__PURE__ */ jsxs(Box, { sx: {
      width: "100%",
      alignItems: "center",
      justifyContent: "space-between",
      display: {
        xs: "flex",
        md: "none"
      }
    }, children: [
      /* @__PURE__ */ jsx(Typography, { component: "div", sx: {
        textAlign: "left",
        display: "inline-block"
      }, children: /* @__PURE__ */ jsx(Logo, { reverse: true, to: "/" }) }),
      /* @__PURE__ */ jsxs(Stack, { direction: "row", spacing: 2, children: [
        layout === "component" && /* @__PURE__ */ jsx(Button, { variant: "outlined", size: "small", color: "warning", component: Link$1, to: APP_DEFAULT_PATH, sx: {
          mt: 0.5,
          height: 28
        }, children: "Dashboard" }),
        layout !== "component" && /* @__PURE__ */ jsx(Button, { variant: "outlined", size: "small", color: "warning", component: Link$1, to: "/components-overview/buttons", sx: {
          mt: 0.5,
          height: 28
        }, children: "All Components" }),
        /* @__PURE__ */ jsx(IconButton, { color: "secondary", ...layout === "component" ? {
          onClick: handleDrawerOpen
        } : {
          onClick: drawerToggler(true)
        }, sx: {
          "&:hover": {
            bgcolor: theme.palette.mode === ThemeMode.DARK ? "secondary.lighter" : "secondary.dark"
          }
        }, children: /* @__PURE__ */ jsx(MenuOutlined, { style: {
          color: theme.palette.mode === ThemeMode.DARK ? "inherit" : theme.palette.grey[100]
        } }) })
      ] }),
      /* @__PURE__ */ jsx(Drawer, { anchor: "top", open: drawerToggle, onClose: drawerToggler(false), sx: {
        "& .MuiDrawer-paper": {
          backgroundImage: "none"
        }
      }, children: /* @__PURE__ */ jsx(Box, { sx: {
        width: "auto",
        "& .MuiListItemIcon-root": {
          fontSize: "1rem",
          minWidth: 28
        }
      }, role: "presentation", onClick: drawerToggler(false), onKeyDown: drawerToggler(false), children: /* @__PURE__ */ jsxs(List, { children: [
        /* @__PURE__ */ jsx(Link, { style: {
          textDecoration: "none"
        }, href: "/login", target: "_blank", children: /* @__PURE__ */ jsxs(ListItemButton, { component: "span", children: [
          /* @__PURE__ */ jsx(ListItemIcon, { children: /* @__PURE__ */ jsx(LineOutlined, {}) }),
          /* @__PURE__ */ jsx(ListItemText, { primary: "Dashboard", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } })
        ] }) }),
        /* @__PURE__ */ jsx(Link, { style: {
          textDecoration: "none"
        }, href: "/components-overview/buttons", target: "_blank", children: /* @__PURE__ */ jsxs(ListItemButton, { component: "span", children: [
          /* @__PURE__ */ jsx(ListItemIcon, { children: /* @__PURE__ */ jsx(LineOutlined, {}) }),
          /* @__PURE__ */ jsx(ListItemText, { primary: "All Components", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } })
        ] }) }),
        /* @__PURE__ */ jsx(Link, { style: {
          textDecoration: "none"
        }, href: "https://github.com/codedthemes/mantis-free-react-admin-template", target: "_blank", children: /* @__PURE__ */ jsxs(ListItemButton, { component: "span", children: [
          /* @__PURE__ */ jsx(ListItemIcon, { children: /* @__PURE__ */ jsx(LineOutlined, {}) }),
          /* @__PURE__ */ jsx(ListItemText, { primary: "Free Version", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } })
        ] }) }),
        /* @__PURE__ */ jsx(Link, { style: {
          textDecoration: "none"
        }, href: "https://codedthemes.gitbook.io/mantis/", target: "_blank", children: /* @__PURE__ */ jsxs(ListItemButton, { component: "span", children: [
          /* @__PURE__ */ jsx(ListItemIcon, { children: /* @__PURE__ */ jsx(LineOutlined, {}) }),
          /* @__PURE__ */ jsx(ListItemText, { primary: "Documentation", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } })
        ] }) }),
        /* @__PURE__ */ jsx(Link, { style: {
          textDecoration: "none"
        }, href: "https://codedthemes.support-hub.io/", target: "_blank", children: /* @__PURE__ */ jsxs(ListItemButton, { component: "span", children: [
          /* @__PURE__ */ jsx(ListItemIcon, { children: /* @__PURE__ */ jsx(LineOutlined, {}) }),
          /* @__PURE__ */ jsx(ListItemText, { primary: "Support", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } })
        ] }) }),
        /* @__PURE__ */ jsx(Link, { style: {
          textDecoration: "none"
        }, href: "https://mui.com/store/items/mantis-react-admin-dashboard-template/", target: "_blank", children: /* @__PURE__ */ jsxs(ListItemButton, { component: "span", children: [
          /* @__PURE__ */ jsx(ListItemIcon, { children: /* @__PURE__ */ jsx(LineOutlined, {}) }),
          /* @__PURE__ */ jsx(ListItemText, { primary: "Purchase Now", primaryTypographyProps: {
            variant: "h6",
            color: "text.primary"
          } }),
          /* @__PURE__ */ jsx(Chip, { color: "primary", label: "v1.0", size: "small" })
        ] }) })
      ] }) }) })
    ] })
  ] }) }) }) });
};
export {
  Header as default
};
//# sourceMappingURL=Header.js.map
