import { jsxs, jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { Box, Typography, DialogTitle, DialogContentText, DialogContent, DialogActions, Button, Dialog } from "@mui/material";
import { Error, Info, WarningAmber } from "@mui/icons-material";
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
  const Icon = severity === "error" ? Error : severity === "info" ? Info : WarningAmber;
  const iconColor = severity === "error" ? "error" : severity === "info" ? "info" : "warning";
  const buttonColor = severity === "error" ? "error" : "warning";
  return /* @__PURE__ */ jsxs(Dialog, { open, onClose: handleClose, "aria-labelledby": "confirm-dialog-title", "aria-describedby": "confirm-dialog-description", maxWidth: "sm", fullWidth: true, children: [
    /* @__PURE__ */ jsx(DialogTitle, { id: "confirm-dialog-title", children: /* @__PURE__ */ jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [
      /* @__PURE__ */ jsx(Icon, { color: iconColor }),
      /* @__PURE__ */ jsx(Typography, { variant: "h6", component: "span", children: title })
    ] }) }),
    /* @__PURE__ */ jsx(DialogContent, { children: /* @__PURE__ */ jsx(DialogContentText, { id: "confirm-dialog-description", children: dialogContent }) }),
    /* @__PURE__ */ jsxs(DialogActions, { children: [
      /* @__PURE__ */ jsx(Button, { onClick: handleCancel, variant: "outlined", color: "inherit", children: cancelButtonText }),
      /* @__PURE__ */ jsx(Button, { onClick: handleConfirm, variant: "contained", color: buttonColor, autoFocus: true, children: confirmButtonText })
    ] })
  ] });
};
export {
  ConfirmDialog as default
};
//# sourceMappingURL=index.js.map
