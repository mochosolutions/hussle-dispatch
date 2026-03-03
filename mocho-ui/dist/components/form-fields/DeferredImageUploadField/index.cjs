"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const material = require("@mui/material");
const iconsMaterial = require("@mui/icons-material");
const imageUploadErrors = require("../../../utils/imageUploadErrors.cjs");
const DeferredImageUploadField = ({
  name,
  existingUrlFieldName,
  label,
  accept = "image/*",
  maxSizeMB = 10,
  previewHeight = 200,
  helperText,
  formik
}) => {
  const heroImageState = formik.values[name];
  const existingUrl = existingUrlFieldName ? formik.values[existingUrlFieldName] : null;
  const [previewUrl, setPreviewUrl] = React.useState(heroImageState?.blobUrl || existingUrl);
  const [validationError, setValidationError] = React.useState(null);
  const fileInputRef = React.useRef(null);
  React.useEffect(() => {
    if (heroImageState?.blobUrl) {
      setPreviewUrl(heroImageState.blobUrl);
    } else if (existingUrl && !heroImageState) {
      setPreviewUrl(existingUrl);
    }
  }, [existingUrl, heroImageState]);
  React.useEffect(() => {
    return () => {
      if (heroImageState?.blobUrl) {
        URL.revokeObjectURL(heroImageState.blobUrl);
      }
    };
  }, []);
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
    if (heroImageState?.blobUrl) {
      URL.revokeObjectURL(heroImageState.blobUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    const newHeroImageState = {
      file,
      blobUrl,
      filename: file.name
    };
    formik.setFieldValue(name, newHeroImageState);
    if (existingUrlFieldName) {
      formik.setFieldValue(existingUrlFieldName, null);
    }
  }, [formik, name, existingUrlFieldName, heroImageState, maxSizeMB]);
  const handleRemove = React.useCallback(() => {
    if (heroImageState?.blobUrl) {
      URL.revokeObjectURL(heroImageState.blobUrl);
    }
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    formik.setFieldValue(name, null);
    if (existingUrlFieldName) {
      formik.setFieldValue(existingUrlFieldName, null);
    }
  }, [formik, name, existingUrlFieldName, heroImageState]);
  const handleSelectClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const hasNewImage = !!heroImageState;
  const hasExistingImage = !!existingUrl && !hasNewImage;
  const hasAnyImage = hasNewImage || hasExistingImage;
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.InputLabel, { children: label }),
    /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { sx: {
      border: 1,
      borderColor: validationError ? "error.main" : "divider",
      borderRadius: 1,
      p: 2,
      textAlign: "center",
      backgroundColor: "background.default",
      minHeight: previewHeight,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative"
    }, children: [
      previewUrl ? /* @__PURE__ */ jsxRuntime.jsx(material.Box, { component: "img", src: previewUrl, alt: "Preview", sx: {
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
      ] }),
      hasNewImage && /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "caption", sx: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "info.main",
        color: "info.contrastText",
        px: 1,
        py: 0.25,
        borderRadius: 1
      }, children: "New" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx("input", { ref: fileInputRef, type: "file", accept, style: {
      display: "none"
    }, onChange: handleFileSelect }),
    validationError && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { error: true, children: validationError.message }),
    /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { direction: "row", spacing: 1, children: [
      /* @__PURE__ */ jsxRuntime.jsx(material.Button, { variant: "outlined", onClick: handleSelectClick, startIcon: /* @__PURE__ */ jsxRuntime.jsx(iconsMaterial.Upload, {}), fullWidth: true, children: hasAnyImage ? "Change Image" : "Select Image" }),
      hasAnyImage && /* @__PURE__ */ jsxRuntime.jsx(material.Button, { variant: "outlined", color: "error", onClick: handleRemove, startIcon: /* @__PURE__ */ jsxRuntime.jsx(iconsMaterial.Delete, {}), children: "Remove" })
    ] }),
    helperText && !validationError && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { children: helperText })
  ] });
};
exports.DeferredImageUploadField = DeferredImageUploadField;
exports.default = DeferredImageUploadField;
//# sourceMappingURL=index.cjs.map
