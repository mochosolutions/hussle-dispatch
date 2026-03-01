"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const IconButton = require("./IconButton.cjs");
const icons = require("@ant-design/icons");
const Snackbar$1 = require("../../node_modules/@mui/material/Snackbar/Snackbar.cjs");
function TransitionSlideLeft(props) {
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Slide, { ...props, direction: "left" });
}
function TransitionSlideUp(props) {
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Slide, { ...props, direction: "up" });
}
function TransitionSlideRight(props) {
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Slide, { ...props, direction: "right" });
}
function TransitionSlideDown(props) {
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Slide, { ...props, direction: "down" });
}
function GrowTransition(props) {
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Grow, { ...props });
}
const animation = {
  SlideLeft: TransitionSlideLeft,
  SlideUp: TransitionSlideUp,
  SlideRight: TransitionSlideRight,
  SlideDown: TransitionSlideDown,
  Grow: GrowTransition,
  Fade: material.Fade
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
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(emotionReactJsxRuntime_browser_esm.Fragment, { children: [
    variant === "default" && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Snackbar$1, { anchorOrigin, open, autoHideDuration, onClose: handleClose, message, TransitionComponent: animation[transition], action: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(emotionReactJsxRuntime_browser_esm.Fragment, { children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Button, { color: "secondary", size: "small", onClick: handleClose, children: "UNDO" }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(IconButton, { size: "small", "aria-label": "close", color: "inherit", onClick: handleClose, sx: {
        mt: 0.25
      }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.CloseOutlined, {}) })
    ] }) }),
    variant === "alert" && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Snackbar$1, { TransitionComponent: animation[transition], anchorOrigin, open, autoHideDuration, onClose: handleClose, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Alert, { variant: alert.variant, color: alert.color, action: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(emotionReactJsxRuntime_browser_esm.Fragment, { children: [
      actionButton !== false && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Button, { color: alert.color, size: "small", onClick: handleClose, children: "UNDO" }),
      close !== false && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(IconButton, { sx: {
        mt: 0.25
      }, size: "small", "aria-label": "close", variant: "contained", color: alert.color, onClick: handleClose, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(icons.CloseOutlined, {}) })
    ] }), sx: {
      ...alert.variant === "outlined" && {
        bgcolor: "grey.0"
      }
    }, children: message }) })
  ] });
};
module.exports = Snackbar;
//# sourceMappingURL=Snackbar.cjs.map
