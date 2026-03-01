"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const formik = require("formik");
const AnimateButton = require("../extended/AnimateButton.cjs");
const lab = require("@mui/lab");
const index = require("../DynamicForm/index.cjs");
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
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Dialog, { open, onClose: handleClose, "aria-labelledby": "form-dialog-title", maxWidth: "sm", fullWidth: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(formik.Formik, { initialValues, validationSchema, onSubmit, children: (formikProps) => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(formik.Form, { noValidate: true, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.DialogTitle, { id: "form-dialog-title", children: dialogTitle }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.DialogContent, { dividers: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index.default, { structure, values: formikProps.values, touched: formikProps.touched, errors: formikProps.errors, handleChange: formikProps.handleChange, handleBlur: formikProps.handleBlur, setFieldValue: formikProps.setFieldValue }) }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.DialogActions, { children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Button, { onClick: (event) => handleClose(event, "buttonClick"), variant: "contained", color: "inherit", disabled: isLoading, children: "Cancel" }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(AnimateButton, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(lab.LoadingButton, { loading: isLoading, type: "submit", variant: "contained", color: "primary", children: actionTitle }) })
    ] })
  ] }) }) });
};
module.exports = FormDialog;
//# sourceMappingURL=index.cjs.map
