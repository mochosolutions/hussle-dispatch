import { jsxs, jsx } from "../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import WarningAmberIcon from "../_virtual/WarningAmber.js";
import Stack from "../node_modules/@mui/material/Stack/Stack.js";
import Typography from "../node_modules/@mui/material/Typography/Typography.js";
import DialogTitle from "../node_modules/@mui/material/DialogTitle/DialogTitle.js";
import DialogContentText from "../node_modules/@mui/material/DialogContentText/DialogContentText.js";
import DialogContent from "../node_modules/@mui/material/DialogContent/DialogContent.js";
import DialogActions from "../node_modules/@mui/material/DialogActions/DialogActions.js";
import Button from "../node_modules/@mui/material/Button/Button.js";
import Dialog from "../node_modules/@mui/material/Dialog/Dialog.js";
const ConfirmDeleteDialog = ({
  open,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}) => /* @__PURE__ */ jsxs(Dialog, { open, onClose: onCancel, "aria-labelledby": "confirm-delete-dialog-title", children: [
  /* @__PURE__ */ jsx(DialogTitle, { id: "confirm-delete-dialog-title", children: /* @__PURE__ */ jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
    /* @__PURE__ */ jsx(WarningAmberIcon, { color: "warning" }),
    /* @__PURE__ */ jsx(Typography, { variant: "h6", children: title })
  ] }) }),
  /* @__PURE__ */ jsx(DialogContent, { children: /* @__PURE__ */ jsx(DialogContentText, { color: "error.main", children: message }) }),
  /* @__PURE__ */ jsxs(DialogActions, { children: [
    /* @__PURE__ */ jsx(Button, { onClick: onCancel, color: "inherit", variant: "outlined", children: cancelLabel }),
    /* @__PURE__ */ jsx(Button, { onClick: onConfirm, color: "error", variant: "contained", children: confirmLabel })
  ] })
] });
export {
  ConfirmDeleteDialog as default
};
//# sourceMappingURL=ConfirmDeleteDialog.js.map
