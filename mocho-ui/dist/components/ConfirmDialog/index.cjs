"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const iconsMaterial = require("@mui/icons-material");
const ConfirmDialog = ({
  open,
  title,
  message,
  content,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  severity = "warning",
  onConfirm,
  onClose
}) => {
  const confirmButtonText = confirmText || confirmLabel || "Confirm";
  const cancelButtonText = cancelText || cancelLabel || "Cancel";
  const dialogContent = content || message;
  const handleConfirm = () => {
    onConfirm();
  };
  const handleCancel = () => {
    onClose();
  };
  const handleClose = (event, reason) => {
    onClose();
  };
  const Icon = severity === "error" ? iconsMaterial.Error : severity === "info" ? iconsMaterial.Info : iconsMaterial.WarningAmber;
  const iconColor = severity === "error" ? "error" : severity === "info" ? "info" : "warning";
  const buttonColor = severity === "error" ? "error" : "warning";
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Dialog, { open, onClose: handleClose, "aria-labelledby": "confirm-dialog-title", "aria-describedby": "confirm-dialog-description", maxWidth: "sm", fullWidth: true, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.DialogTitle, { id: "confirm-dialog-title", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { display: "flex", alignItems: "center", gap: 1, children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Icon, { color: iconColor }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h6", component: "span", children: title })
    ] }) }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.DialogContent, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.DialogContentText, { id: "confirm-dialog-description", children: dialogContent }) }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.DialogActions, { children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Button, { onClick: handleCancel, variant: "outlined", color: "inherit", children: cancelButtonText }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Button, { onClick: handleConfirm, variant: "contained", color: buttonColor, autoFocus: true, children: confirmButtonText })
    ] })
  ] });
};
module.exports = ConfirmDialog;
//# sourceMappingURL=index.cjs.map
