"use strict";
const emotionReactJsxRuntime_browser_esm = require("../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const WarningAmber = require("../_virtual/WarningAmber.cjs");
const Stack = require("../node_modules/@mui/material/Stack/Stack.cjs");
const Typography = require("../node_modules/@mui/material/Typography/Typography.cjs");
const DialogTitle = require("../node_modules/@mui/material/DialogTitle/DialogTitle.cjs");
const DialogContentText = require("../node_modules/@mui/material/DialogContentText/DialogContentText.cjs");
const DialogContent = require("../node_modules/@mui/material/DialogContent/DialogContent.cjs");
const DialogActions = require("../node_modules/@mui/material/DialogActions/DialogActions.cjs");
const Button = require("../node_modules/@mui/material/Button/Button.cjs");
const Dialog = require("../node_modules/@mui/material/Dialog/Dialog.cjs");
const ConfirmDeleteDialog = ({
  open,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Dialog, { open, onClose: onCancel, "aria-labelledby": "confirm-delete-dialog-title", children: [
  /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(DialogTitle, { id: "confirm-delete-dialog-title", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(WarningAmber, { color: "warning" }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Typography.default, { variant: "h6", children: title })
  ] }) }),
  /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(DialogContent, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(DialogContentText, { color: "error.main", children: message }) }),
  /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(DialogActions, { children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Button, { onClick: onCancel, color: "inherit", variant: "outlined", children: cancelLabel }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(Button, { onClick: onConfirm, color: "error", variant: "contained", children: confirmLabel })
  ] })
] });
module.exports = ConfirmDeleteDialog;
//# sourceMappingURL=ConfirmDeleteDialog.cjs.map
