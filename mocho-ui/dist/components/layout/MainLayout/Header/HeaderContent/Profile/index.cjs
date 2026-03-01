"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const material = require("@mui/material");
const icons = require("@ant-design/icons");
const Avatar = require("../../../../../extended/Avatar.cjs");
const index = require("../../../../../MainCard/index.cjs");
const Transitions = require("../../../../../extended/Transitions.cjs");
const IconButton = require("../../../../../extended/IconButton.cjs");
const LayoutContext = require("../../../../LayoutContext.cjs");
const config = require("../../../../../../types/config.cjs");
const useTheme = require("../../../../../../node_modules/@mui/material/styles/useTheme.cjs");
const Profile = () => {
  const theme = useTheme();
  const {
    user,
    onLogout
  } = LayoutContext.useLayout();
  const userFullName = user?.name || "User";
  const currentOrgName = user?.organizationName || "No active organization";
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    }
  };
  const anchorRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };
  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };
  const iconBackColorOpen = theme.palette.mode === config.ThemeMode.DARK ? "grey.200" : "grey.300";
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { sx: {
    flexShrink: 0,
    ml: 0.75
  }, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ButtonBase, { sx: {
      p: 0.25,
      bgcolor: open ? iconBackColorOpen : "transparent",
      borderRadius: 1,
      "&:hover": {
        bgcolor: theme.palette.mode === config.ThemeMode.DARK ? "secondary.light" : "secondary.lighter"
      },
      "&:focus-visible": {
        outline: `2px solid ${theme.palette.secondary.dark}`,
        outlineOffset: 2
      }
    }, "aria-label": "open profile", ref: anchorRef, "aria-controls": open ? "profile-grow" : void 0, "aria-haspopup": "true", onClick: handleToggle, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Stack, { direction: "row", spacing: 2, alignItems: "center", sx: {
      p: 0.5
    }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "subtitle1", textTransform: "capitalize", children: userFullName }) }) }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Popper, { placement: "bottom-end", open, anchorEl: anchorRef.current, role: void 0, transition: true, disablePortal: true, popperOptions: {
      modifiers: [{
        name: "offset",
        options: {
          offset: [0, 9]
        }
      }]
    }, children: ({
      TransitionProps
    }) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Transitions, { type: "grow", position: "top-right", in: open, ...TransitionProps, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Paper, { sx: {
      display: "flex",
      boxShadow: theme.customShadows.z1,
      width: "100%",
      minWidth: 240,
      maxWidth: 290,
      [theme.breakpoints.down("md")]: {
        maxWidth: 250
      }
    }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ClickAwayListener, { onClickAway: handleClose, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index, { elevation: 0, border: false, content: false, style: {
      // border: "1px solid red",
      width: "100%",
      height: "100%"
    }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(
      material.CardContent,
      {
        children: [
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Grid, { container: true, justifyContent: "space-between", alignItems: "center", children: [
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Grid, { item: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Stack, { direction: "row", spacing: 1.25, alignItems: "center", children: [
              /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(
                Avatar,
                {
                  alt: "profile user",
                  sx: {
                    width: 32,
                    height: 32
                  }
                }
              ),
              /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Stack, { children: [
                /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h6", textTransform: "capitalize", children: userFullName }),
                /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "body2", color: "textSecondary" })
              ] })
            ] }) }),
            /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Grid, { item: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { title: "Logout", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(IconButton, { size: "large", sx: {
              color: "text.primary"
            }, onClick: handleLogout, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.LogoutOutlined, {}) }) }) })
          ] }),
          /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { sx: {
            mt: 2
          }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "body2", color: "textSecondary", textTransform: "capitalize", children: currentOrgName }) })
        ]
      }
    ) }) }) }) }) })
  ] });
};
module.exports = Profile;
//# sourceMappingURL=index.cjs.map
