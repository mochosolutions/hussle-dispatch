"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const material = require("@mui/material");
const iconsMaterial = require("@mui/icons-material");
const imageUploadErrors = require("../../../utils/imageUploadErrors.cjs");
const useDocumentUpload = require("../../../hooks/useDocumentUpload.cjs");
function getStatusMessage(state, progress) {
  switch (state) {
    case "requesting":
      return "Preparing upload...";
    case "uploading":
      return `Uploading... ${progress}%`;
    case "processing":
      return "Processing image...";
    case "complete":
      return "Upload complete";
    case "error":
      return "Upload failed";
    default:
      return "";
  }
}
const DocumentImageUploadField = ({
  name,
  urlFieldName,
  label,
  category,
  accept = "image/*",
  maxSizeMB = 10,
  previewHeight = 200,
  helperText,
  formik
}) => {
  formik.values[name];
  const existingUrl = urlFieldName ? formik.values[urlFieldName] : null;
  const [previewUrl, setPreviewUrl] = React.useState(existingUrl);
  const [validationError, setValidationError] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const {
    state,
    progress,
    error: uploadError,
    result,
    upload,
    cancel,
    reset
  } = useDocumentUpload.useDocumentUpload({
    category,
    onComplete: (uploadResult) => {
      formik.setFieldValue(name, uploadResult.documentId);
      if (urlFieldName) {
        formik.setFieldValue(urlFieldName, uploadResult.variants.medium || uploadResult.variants.original);
      }
      setPreviewUrl(uploadResult.variants.medium || uploadResult.variants.original);
    },
    onError: (err) => {
      console.error("Document upload error:", err);
    }
  });
  React.useEffect(() => {
    if (existingUrl && !previewUrl) {
      setPreviewUrl(existingUrl);
    }
  }, [existingUrl, previewUrl]);
  React.useEffect(() => {
    return () => {
      if (state !== "idle" && state !== "complete") {
        cancel();
      }
    };
  }, [state, cancel]);
  const handleFileSelect = React.useCallback(async (event) => {
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
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    try {
      await upload(file);
    } catch {
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }, [upload, maxSizeMB]);
  const handleRemove = React.useCallback(async () => {
    if (state !== "idle" && state !== "complete") {
      await cancel();
    }
    reset();
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    formik.setFieldValue(name, null);
    if (urlFieldName) {
      formik.setFieldValue(urlFieldName, null);
    }
  }, [state, cancel, reset, formik, name, urlFieldName]);
  const handleSelectClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const isUploading = state === "requesting" || state === "uploading" || state === "processing";
  const hasError = validationError || uploadError;
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.InputLabel, { children: label }),
    /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { sx: {
      border: 1,
      borderColor: hasError ? "error.main" : state === "complete" ? "success.main" : "divider",
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
        borderRadius: 1,
        opacity: isUploading ? 0.5 : 1
      } }) : /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 1, alignItems: "center", children: [
        /* @__PURE__ */ jsxRuntime.jsx(iconsMaterial.Image, { sx: {
          fontSize: 48,
          color: "text.disabled"
        } }),
        /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { color: "text.secondary", variant: "body2", children: "No image selected" })
      ] }),
      state === "complete" && /* @__PURE__ */ jsxRuntime.jsx(iconsMaterial.CheckCircle, { sx: {
        position: "absolute",
        top: 8,
        right: 8,
        color: "success.main"
      } })
    ] }),
    isUploading && /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { sx: {
      width: "100%"
    }, children: [
      /* @__PURE__ */ jsxRuntime.jsx(material.LinearProgress, { variant: state === "uploading" ? "determinate" : "indeterminate", value: state === "uploading" ? progress : void 0 }),
      /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "caption", color: "text.secondary", sx: {
        mt: 0.5
      }, children: getStatusMessage(state, progress) })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx("input", { ref: fileInputRef, type: "file", accept, style: {
      display: "none"
    }, onChange: handleFileSelect, disabled: isUploading }),
    validationError && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { error: true, children: validationError.message }),
    uploadError && /* @__PURE__ */ jsxRuntime.jsx(material.Alert, { severity: "error", sx: {
      py: 0.5
    }, children: uploadError }),
    /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { direction: "row", spacing: 1, children: [
      /* @__PURE__ */ jsxRuntime.jsx(material.Button, { variant: "outlined", onClick: handleSelectClick, startIcon: /* @__PURE__ */ jsxRuntime.jsx(iconsMaterial.Upload, {}), disabled: isUploading, fullWidth: true, children: isUploading ? "Uploading..." : "Select Image" }),
      (previewUrl || isUploading) && /* @__PURE__ */ jsxRuntime.jsx(material.Button, { variant: "outlined", color: "error", onClick: handleRemove, startIcon: /* @__PURE__ */ jsxRuntime.jsx(iconsMaterial.Delete, {}), disabled: false, children: isUploading ? "Cancel" : "Remove" })
    ] }),
    helperText && !hasError && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { children: helperText })
  ] });
};
exports.DocumentImageUploadField = DocumentImageUploadField;
exports.default = DocumentImageUploadField;
//# sourceMappingURL=index.cjs.map
