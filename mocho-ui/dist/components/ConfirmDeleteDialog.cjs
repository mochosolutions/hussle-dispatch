"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const Dialog = require("@mui/material/Dialog");
const DialogTitle = require("@mui/material/DialogTitle");
const DialogContent = require("@mui/material/DialogContent");
const DialogContentText = require("@mui/material/DialogContentText");
const DialogActions = require("@mui/material/DialogActions");
const Button = require("@mui/material/Button");
const WarningAmberIcon = require("@mui/icons-material/WarningAmber");
const Stack = require("@mui/material/Stack");
const Typography = require("@mui/material/Typography");
const ConfirmDeleteDialog = ({
  open,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}) => /* @__PURE__ */ jsxRuntime.jsxs(Dialog, { open, onClose: onCancel, "aria-labelledby": "confirm-delete-dialog-title", children: [
  /* @__PURE__ */ jsxRuntime.jsx(DialogTitle, { id: "confirm-delete-dialog-title", children: /* @__PURE__ */ jsxRuntime.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
    /* @__PURE__ */ jsxRuntime.jsx(WarningAmberIcon, { color: "warning" }),
    /* @__PURE__ */ jsxRuntime.jsx(Typography, { variant: "h6", children: title })
  ] }) }),
  /* @__PURE__ */ jsxRuntime.jsx(DialogContent, { children: /* @__PURE__ */ jsxRuntime.jsx(DialogContentText, { color: "error.main", children: message }) }),
  /* @__PURE__ */ jsxRuntime.jsxs(DialogActions, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(Button, { onClick: onCancel, color: "inherit", variant: "outlined", children: cancelLabel }),
    /* @__PURE__ */ jsxRuntime.jsx(Button, { onClick: onConfirm, color: "error", variant: "contained", children: confirmLabel })
  ] })
] });
module.exports = ConfirmDeleteDialog;
//# sourceMappingURL=ConfirmDeleteDialog.cjs.map
