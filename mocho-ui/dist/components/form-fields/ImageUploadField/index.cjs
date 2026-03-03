"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const material = require("@mui/material");
const iconsMaterial = require("@mui/icons-material");
const imageUploadErrors = require("../../../utils/imageUploadErrors.cjs");
const ImageUploadField = ({
  name,
  urlFieldName,
  label,
  accept = "image/*",
  maxSizeMB = 10,
  previewHeight = 200,
  helperText,
  formik
}) => {
  const existingUrl = urlFieldName ? formik.values[urlFieldName] : null;
  const [previewUrl, setPreviewUrl] = React.useState(existingUrl);
  const [validationError, setValidationError] = React.useState(null);
  const fileInputRef = React.useRef(null);
  React.useEffect(() => {
    if (existingUrl && !previewUrl) {
      setPreviewUrl(existingUrl);
    }
  }, [existingUrl, previewUrl]);
  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  const handleFileSelect = React.useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const error = imageUploadErrors.validateImageBeforeUpload(file, maxSizeMB);
    if (error) {
      setValidationError(error);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    setValidationError(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    formik.setFieldValue(name, file);
    if (urlFieldName) {
      formik.setFieldValue(urlFieldName, null);
    }
  }, [formik, name, urlFieldName, maxSizeMB, previewUrl]);
  const handleRemove = React.useCallback(() => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    formik.setFieldValue(name, null);
    if (urlFieldName) {
      formik.setFieldValue(urlFieldName, null);
    }
  }, [formik, name, urlFieldName, previewUrl]);
  const handleSelectClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.InputLabel, { children: label }),
    /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: {
      border: 1,
      borderColor: validationError ? "error.main" : "divider",
      borderRadius: 1,
      p: 2,
      textAlign: "center",
      backgroundColor: "background.default",
      minHeight: previewHeight,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }, children: previewUrl ? /* @__PURE__ */ jsxRuntime.jsx(material.Box, { component: "img", src: previewUrl, alt: "Preview", sx: {
      maxWidth: "100%",
      maxHeight: previewHeight,
      objectFit: "contain",
      borderRadius: 1
    } }) : /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 1, alignItems: "center", children: [
      /* @__PURE__ */ jsxRuntime.jsx(iconsMaterial.Image, { sx: {
        fontSize: 48,
        color: "text.disabled"
      } }),
      /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { color: "text.secondary", variant: "body2", children: "No image selected" })
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsx("input", { ref: fileInputRef, type: "file", accept, style: {
      display: "none"
    }, onChange: handleFileSelect }),
    validationError && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { error: true, children: validationError.message }),
    /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { direction: "row", spacing: 1, children: [
      /* @__PURE__ */ jsxRuntime.jsx(material.Button, { variant: "outlined", onClick: handleSelectClick, startIcon: /* @__PURE__ */ jsxRuntime.jsx(iconsMaterial.Upload, {}), fullWidth: true, children: "Select Image" }),
      previewUrl && /* @__PURE__ */ jsxRuntime.jsx(material.Button, { variant: "outlined", color: "error", onClick: handleRemove, startIcon: /* @__PURE__ */ jsxRuntime.jsx(iconsMaterial.Delete, {}), children: "Remove" })
    ] }),
    helperText && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { children: helperText })
  ] });
};
exports.ImageUploadField = ImageUploadField;
//# sourceMappingURL=index.cjs.map
