"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
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
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Dialog, { open, onClose: handleClose, "aria-labelledby": "confirm-dialog-title", "aria-describedby": "confirm-dialog-description", maxWidth: "sm", fullWidth: true, children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.DialogTitle, { id: "confirm-dialog-title", children: /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { display: "flex", alignItems: "center", gap: 1, children: [
      /* @__PURE__ */ jsxRuntime.jsx(Icon, { color: iconColor }),
      /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h6", component: "span", children: title })
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsx(material.DialogContent, { children: /* @__PURE__ */ jsxRuntime.jsx(material.DialogContentText, { id: "confirm-dialog-description", children: dialogContent }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(material.DialogActions, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(material.Button, { onClick: handleCancel, variant: "outlined", color: "inherit", children: cancelButtonText }),
      /* @__PURE__ */ jsxRuntime.jsx(material.Button, { onClick: handleConfirm, variant: "contained", color: buttonColor, autoFocus: true, children: confirmButtonText })
    ] })
  ] });
};
module.exports = ConfirmDialog;
//# sourceMappingURL=index.cjs.map
