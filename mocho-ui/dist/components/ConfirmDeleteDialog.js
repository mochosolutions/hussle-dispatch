import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
