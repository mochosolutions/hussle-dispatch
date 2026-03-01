import { jsx, jsxs } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { DialogTitle, DialogContent, DialogActions, Button, Dialog } from "@mui/material";
import { Formik, Form } from "formik";
import AnimateButton from "../extended/AnimateButton.js";
import { LoadingButton } from "@mui/lab";
import DynamicForm from "../DynamicForm/index.js";
const FormDialog = ({
  open,
  onClose,
  onSubmit,
  structure,
  actionTitle,
  dialogTitle,
  isLoading = false,
  validationSchema = {},
  initialValues = {}
}) => {
  const handleClose = (event, reason) => {
    if (isLoading && (reason === "backdropClick" || reason === "escapeKeyDown")) {
      return;
    }
    if (onClose) {
      onClose();
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onClose: handleClose, "aria-labelledby": "form-dialog-title", maxWidth: "sm", fullWidth: true, children: /* @__PURE__ */ jsx(Formik, { initialValues, validationSchema, onSubmit, children: (formikProps) => /* @__PURE__ */ jsxs(Form, { noValidate: true, children: [
    /* @__PURE__ */ jsx(DialogTitle, { id: "form-dialog-title", children: dialogTitle }),
    /* @__PURE__ */ jsx(DialogContent, { dividers: true, children: /* @__PURE__ */ jsx(DynamicForm, { structure, values: formikProps.values, touched: formikProps.touched, errors: formikProps.errors, handleChange: formikProps.handleChange, handleBlur: formikProps.handleBlur, setFieldValue: formikProps.setFieldValue }) }),
    /* @__PURE__ */ jsxs(DialogActions, { children: [
      /* @__PURE__ */ jsx(Button, { onClick: (event) => handleClose(event, "buttonClick"), variant: "contained", color: "inherit", disabled: isLoading, children: "Cancel" }),
      /* @__PURE__ */ jsx(AnimateButton, { children: /* @__PURE__ */ jsx(LoadingButton, { loading: isLoading, type: "submit", variant: "contained", color: "primary", children: actionTitle }) })
    ] })
  ] }) }) });
};
export {
  FormDialog as default
};
//# sourceMappingURL=index.js.map
