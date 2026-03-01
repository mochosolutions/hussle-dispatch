import { jsxs, jsx, Fragment } from "../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import ArrowDropDownIcon from "../../../_virtual/ArrowDropDown.js";
import ExpandMoreIcon from "../../../_virtual/ExpandMore.js";
import ExpandLessIcon from "../../../_virtual/ExpandLess.js";
import { Logo } from "../../Logo/index.js";
import IconButton from "../../extended/IconButton.js";
import MenuOutlined from "../../../_virtual/MenuOutlined.js";
import { AnimatePresence, motion } from "framer-motion";
import useTheme from "../../../node_modules/@mui/material/styles/useTheme.js";
import useMediaQuery from "../../../node_modules/@mui/system/esm/useMediaQuery/useMediaQuery.js";
import Typography from "../../../node_modules/@mui/material/Typography/Typography.js";
import ListItemButton from "../../../node_modules/@mui/material/ListItemButton/ListItemButton.js";
import ListItemText from "../../../node_modules/@mui/material/ListItemText/ListItemText.js";
import Collapse from "../../../node_modules/@mui/material/Collapse/Collapse.js";
import List from "../../../node_modules/@mui/material/List/List.js";
import ListItem from "../../../node_modules/@mui/material/ListItem/ListItem.js";
import Box from "../../../node_modules/@mui/material/Box/Box.js";
import Container from "../../../node_modules/@mui/material/Container/Container.js";
import Stack from "../../../node_modules/@mui/material/Stack/Stack.js";
import styled from "../../../node_modules/@mui/material/styles/styled.js";
import Paper from "../../../node_modules/@mui/material/Paper/Paper.js";
import Divider from "../../../node_modules/@mui/material/Divider/Divider.js";
import Button from "../../../node_modules/@mui/material/Button/Button.js";
import Drawer from "../../../node_modules/@mui/material/Drawer/Drawer.js";
import Toolbar from "../../../node_modules/@mui/material/Toolbar/Toolbar.js";
import AppBar from "../../../node_modules/@mui/material/AppBar/AppBar.js";
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
const StyledRouterLink = styled(Link)(({
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
  const [drawerToggle, setDrawerToggle] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [openItems, setOpenItems] = useState({});
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleToggle = (label) => {
    setOpenItems((prev) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };
  const drawer = /* @__PURE__ */ jsxs(Box, { sx: {
    textAlign: "center"
  }, children: [
    /* @__PURE__ */ jsx(Typography, { sx: {
      textAlign: "left",
      display: "inline-block"
    }, children: /* @__PURE__ */ jsx(Logo, { reverse: true, to: "/" }) }),
    /* @__PURE__ */ jsx(List, { children: navItems.map((item) => item.children ? /* @__PURE__ */ jsxs(React.Fragment, { children: [
      /* @__PURE__ */ jsxs(ListItemButton, { onClick: () => handleToggle(item.label), children: [
        /* @__PURE__ */ jsx(ListItemText, { primary: item.label }),
        openItems[item.label] ? /* @__PURE__ */ jsx(ExpandLessIcon, { fontSize: "small" }) : /* @__PURE__ */ jsx(ExpandMoreIcon, { fontSize: "small" })
      ] }),
      /* @__PURE__ */ jsx(Collapse, { in: openItems[item.label], timeout: "auto", unmountOnExit: true, children: /* @__PURE__ */ jsx(List, { component: "div", disablePadding: true, children: item.children.items.map((child) => /* @__PURE__ */ jsx(ListItem, { disablePadding: true, children: /* @__PURE__ */ jsx(
        ListItemButton,
        {
          href: child.path,
          onClick: handleDrawerToggle,
          sx: {
            pl: 4
          },
          children: /* @__PURE__ */ jsx(ListItemText, { primary: child.label })
        }
      ) }, child.label)) }) })
    ] }, item.label) : /* @__PURE__ */ jsx(ListItem, { disablePadding: true, children: /* @__PURE__ */ jsx(
      ListItemButton,
      {
        href: item.path,
        onClick: handleDrawerToggle,
        children: /* @__PURE__ */ jsx(ListItemText, { primary: item.label })
      }
    ) }, item.label)) })
  ] });
  return (
    // <ElevationScroll>
    /* @__PURE__ */ jsx(AppBar, { sx: {
      bgcolor: theme.palette.background.paper,
      color: "text.primary",
      boxShadow: "none",
      borderBottom: `1px solid ${theme.palette.grey[200]}`
    }, component: "nav", elevation: 0, position: "sticky", children: /* @__PURE__ */ jsx(Container, { disableGutters: downMD, children: /* @__PURE__ */ jsxs(Toolbar, { children: [
      /* @__PURE__ */ jsx(Stack, { direction: "row", sx: {
        flexGrow: 1,
        display: {
          xs: "none",
          md: "block"
        }
      }, alignItems: "center", children: /* @__PURE__ */ jsx(Typography, { sx: {
        textAlign: "left",
        display: "inline-block"
      }, children: /* @__PURE__ */ jsx(Logo, { reverse: true, to: "/" }) }) }),
      /* @__PURE__ */ jsx(Stack, { direction: "row", sx: {
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
      }, spacing: 2, children: !isMobile && /* @__PURE__ */ jsxs(Box, { sx: {
        display: "flex",
        gap: 2
      }, onMouseLeave: () => setHoveredItem(null), children: [
        navItems.map((item) => {
          const isActive = hoveredItem?.label === item.label;
          const hasDropdown = item.children && !item.customSubHeader;
          const hasSubHeader = !!item.customSubHeader;
          return /* @__PURE__ */ jsxs(Box, { sx: {
            display: "flex",
            alignItems: "center",
            position: "relative"
          }, children: [
            /* @__PURE__ */ jsxs(
              StyledRouterLink,
              {
                to: item.path,
                onMouseEnter: () => setHoveredItem(item),
                children: [
                  item.label,
                  hasDropdown && /* @__PURE__ */ jsx(ArrowDropDownIcon, {})
                ]
              }
            ),
            /* @__PURE__ */ jsxs(AnimatePresence, { children: [
              isActive && hasSubHeader && /* @__PURE__ */ jsx(motion.div, { initial: {
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
              }, children: /* @__PURE__ */ jsx(Box, { sx: {
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: 3
              }, children: item.customSubHeader }) }, "subHeader"),
              isActive && hasDropdown && /* @__PURE__ */ jsx(motion.div, { initial: {
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
              }, children: /* @__PURE__ */ jsxs(Paper, { elevation: 2, sx: {
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: 3
              }, children: [
                item.children?.header && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Typography, { variant: "subtitle2", sx: {
                    px: 2,
                    py: 1
                  }, children: item.children.header }),
                  /* @__PURE__ */ jsx(Divider, {})
                ] }),
                /* @__PURE__ */ jsx(Box, { sx: {
                  display: "flex",
                  flexDirection: "column",
                  px: 2
                }, children: item?.children?.items.map((child) => /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsx(
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
      /* @__PURE__ */ jsxs(Box, { sx: {
        width: "100%",
        // alignItems: 'center',
        justifyContent: "space-between",
        display: {
          xs: "flex",
          md: "none"
        }
      }, children: [
        /* @__PURE__ */ jsx(Typography, { sx: {
          textAlign: "left",
          display: "inline-block"
        }, children: /* @__PURE__ */ jsx(Logo, { reverse: true, to: "/" }) }),
        /* @__PURE__ */ jsx(Stack, { direction: "row", spacing: 2, alignItems: "center", children: /* @__PURE__ */ jsx(IconButton, { color: "inherit", onClick: handleDrawerToggle, sx: {
          "&:hover": {
            bgcolor: "secondary.light"
          }
        }, children: /* @__PURE__ */ jsx(MenuOutlined, {}) }) }),
        isMobile && /* @__PURE__ */ jsx(Drawer, { anchor: "top", open: mobileOpen, onClose: handleDrawerToggle, sx: {
          "& .MuiDrawer-paper": {
            backgroundImage: "none"
          }
        }, children: /* @__PURE__ */ jsx(
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
export {
  Header as default
};
//# sourceMappingURL=Header.js.map
