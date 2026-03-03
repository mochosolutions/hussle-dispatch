import { jsxs, Fragment, jsx } from "@emotion/react/jsx-runtime";
import { Fade, Button, Alert, Grow, Slide } from "@mui/material";
import MuiSnackbar from "@mui/material/Snackbar";
import IconButton from "./IconButton.js";
import { CloseOutlined } from "@ant-design/icons";
function TransitionSlideLeft(props) {
  return /* @__PURE__ */ jsx(Slide, { ...props, direction: "left" });
}
function TransitionSlideUp(props) {
  return /* @__PURE__ */ jsx(Slide, { ...props, direction: "up" });
}
function TransitionSlideRight(props) {
  return /* @__PURE__ */ jsx(Slide, { ...props, direction: "right" });
}
function TransitionSlideDown(props) {
  return /* @__PURE__ */ jsx(Slide, { ...props, direction: "down" });
}
function GrowTransition(props) {
  return /* @__PURE__ */ jsx(Grow, { ...props });
}
const animation = {
  SlideLeft: TransitionSlideLeft,
  SlideUp: TransitionSlideUp,
  SlideRight: TransitionSlideRight,
  SlideDown: TransitionSlideDown,
  Grow: GrowTransition,
  Fade
};
const Snackbar = ({
  open,
  message,
  variant = "default",
  autoHideDuration = 6e3,
  anchorOrigin = {
    vertical: "bottom",
    horizontal: "right"
  },
  transition = "SlideUp",
  actionButton = true,
  close = true,
  alert = {
    variant: "filled",
    color: "success"
  },
  onClose
}) => {
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    onClose();
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    variant === "default" && /* @__PURE__ */ jsx(MuiSnackbar, { anchorOrigin, open, autoHideDuration, onClose: handleClose, message, TransitionComponent: animation[transition], action: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Button, { color: "secondary", size: "small", onClick: handleClose, children: "UNDO" }),
      /* @__PURE__ */ jsx(IconButton, { size: "small", "aria-label": "close", color: "inherit", onClick: handleClose, sx: {
        mt: 0.25
      }, children: /* @__PURE__ */ jsx(CloseOutlined, {}) })
    ] }) }),
    variant === "alert" && /* @__PURE__ */ jsx(MuiSnackbar, { TransitionComponent: animation[transition], anchorOrigin, open, autoHideDuration, onClose: handleClose, children: /* @__PURE__ */ jsx(Alert, { variant: alert.variant, color: alert.color, action: /* @__PURE__ */ jsxs(Fragment, { children: [
      actionButton !== false && /* @__PURE__ */ jsx(Button, { color: alert.color, size: "small", onClick: handleClose, children: "UNDO" }),
      close !== false && /* @__PURE__ */ jsx(IconButton, { sx: {
        mt: 0.25
      }, size: "small", "aria-label": "close", variant: "contained", color: alert.color, onClick: handleClose, children: /* @__PURE__ */ jsx(CloseOutlined, {}) })
    ] }), sx: {
      ...alert.variant === "outlined" && {
        bgcolor: "grey.0"
      }
    }, children: message }) })
  ] });
};
export {
  Snackbar as default
};
//# sourceMappingURL=Snackbar.js.map
