import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, ButtonBase, Stack, Typography, Popper, Paper, ClickAwayListener, CardContent, Grid, Tooltip } from "@mui/material";
import { LogoutOutlined } from "@ant-design/icons";
import Avatar from "../../../../../extended/Avatar.js";
import MainCard from "../../../../../MainCard/index.js";
import Transitions from "../../../../../extended/Transitions.js";
import IconButton from "../../../../../extended/IconButton.js";
import { ThemeMode } from "../../../../../../types/config.js";
const Profile = ({
  user,
  onLogout
}) => {
  const theme = useTheme();
  const userFullName = user?.name ?? "User";
  const currentOrgName = user?.organizationName ?? "No active organization";
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };
  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };
  const iconBackColorOpen = theme.palette.mode === ThemeMode.DARK ? "grey.200" : "grey.300";
  return /* @__PURE__ */ jsxs(Box, { sx: {
    flexShrink: 0,
    ml: 0.75
  }, children: [
    /* @__PURE__ */ jsx(ButtonBase, { sx: {
      p: 0.25,
      bgcolor: open ? iconBackColorOpen : "transparent",
      borderRadius: 1,
      "&:hover": {
        bgcolor: theme.palette.mode === ThemeMode.DARK ? "secondary.light" : "secondary.lighter"
      },
      "&:focus-visible": {
        outline: `2px solid ${theme.palette.secondary.dark}`,
        outlineOffset: 2
      }
    }, "aria-label": "open profile", ref: anchorRef, "aria-controls": open ? "profile-grow" : void 0, "aria-haspopup": "true", onClick: handleToggle, children: /* @__PURE__ */ jsx(Stack, { direction: "row", spacing: 2, alignItems: "center", sx: {
      p: 0.5
    }, children: /* @__PURE__ */ jsx(Typography, { variant: "subtitle1", textTransform: "capitalize", children: userFullName }) }) }),
    /* @__PURE__ */ jsx(Popper, { placement: "bottom-end", open, anchorEl: anchorRef.current, role: void 0, transition: true, disablePortal: true, popperOptions: {
      modifiers: [{
        name: "offset",
        options: {
          offset: [0, 9]
        }
      }]
    }, children: ({
      TransitionProps
    }) => /* @__PURE__ */ jsx(Transitions, { type: "grow", position: "top-right", in: open, ...TransitionProps, children: /* @__PURE__ */ jsx(Paper, { sx: {
      display: "flex",
      boxShadow: theme.customShadows.z1,
      width: "100%",
      minWidth: 240,
      maxWidth: 290,
      [theme.breakpoints.down("md")]: {
        maxWidth: 250
      }
    }, children: /* @__PURE__ */ jsx(ClickAwayListener, { onClickAway: handleClose, children: /* @__PURE__ */ jsx(MainCard, { elevation: 0, border: false, content: false, sx: {
      width: "100%",
      height: "100%"
    }, children: /* @__PURE__ */ jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxs(Grid, { container: true, justifyContent: "space-between", alignItems: "center", children: [
        /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsxs(Stack, { direction: "row", spacing: 1.25, alignItems: "center", children: [
          /* @__PURE__ */ jsx(Avatar, { alt: "profile user", src: user?.avatar, sx: {
            width: 32,
            height: 32
          } }),
          /* @__PURE__ */ jsxs(Stack, { children: [
            /* @__PURE__ */ jsx(Typography, { variant: "h6", textTransform: "capitalize", children: userFullName }),
            /* @__PURE__ */ jsx(Typography, { variant: "body2", color: "textSecondary" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(Tooltip, { title: "Logout", children: /* @__PURE__ */ jsx(IconButton, { size: "large", sx: {
          color: "text.primary"
        }, onClick: handleLogout, children: /* @__PURE__ */ jsx(LogoutOutlined, {}) }) }) })
      ] }),
      /* @__PURE__ */ jsx(Box, { sx: {
        mt: 2
      }, children: /* @__PURE__ */ jsx(Typography, { variant: "body2", color: "textSecondary", textTransform: "capitalize", children: currentOrgName }) })
    ] }) }) }) }) }) })
  ] });
};
export {
  Profile as default
};
//# sourceMappingURL=index.js.map
