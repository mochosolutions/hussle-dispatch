import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import { Stack, InputLabel, Box, Typography, LinearProgress, FormHelperText, Alert, Button } from "@mui/material";
import { Image, CheckCircle, Upload, Delete } from "@mui/icons-material";
import { validateImageBeforeUpload } from "../../../utils/imageUploadErrors.js";
import { useDocumentUpload } from "../../../hooks/useDocumentUpload.js";
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
  const [previewUrl, setPreviewUrl] = useState(existingUrl);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);
  const {
    state,
    progress,
    error: uploadError,
    result,
    upload,
    cancel,
    reset
  } = useDocumentUpload({
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
  useEffect(() => {
    if (existingUrl && !previewUrl) {
      setPreviewUrl(existingUrl);
    }
  }, [existingUrl, previewUrl]);
  useEffect(() => {
    return () => {
      if (state !== "idle" && state !== "complete") {
        cancel();
      }
    };
  }, [state, cancel]);
  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const error = validateImageBeforeUpload(file, maxSizeMB);
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
  const handleRemove = useCallback(async () => {
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
  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const isUploading = state === "requesting" || state === "uploading" || state === "processing";
  const hasError = validationError || uploadError;
  return /* @__PURE__ */ jsxs(Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsx(InputLabel, { children: label }),
    /* @__PURE__ */ jsxs(Box, { sx: {
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
      previewUrl ? /* @__PURE__ */ jsx(Box, { component: "img", src: previewUrl, alt: "Preview", sx: {
        maxWidth: "100%",
        maxHeight: previewHeight,
        objectFit: "contain",
        borderRadius: 1,
        opacity: isUploading ? 0.5 : 1
      } }) : /* @__PURE__ */ jsxs(Stack, { spacing: 1, alignItems: "center", children: [
        /* @__PURE__ */ jsx(Image, { sx: {
          fontSize: 48,
          color: "text.disabled"
        } }),
        /* @__PURE__ */ jsx(Typography, { color: "text.secondary", variant: "body2", children: "No image selected" })
      ] }),
      state === "complete" && /* @__PURE__ */ jsx(CheckCircle, { sx: {
        position: "absolute",
        top: 8,
        right: 8,
        color: "success.main"
      } })
    ] }),
    isUploading && /* @__PURE__ */ jsxs(Box, { sx: {
      width: "100%"
    }, children: [
      /* @__PURE__ */ jsx(LinearProgress, { variant: state === "uploading" ? "determinate" : "indeterminate", value: state === "uploading" ? progress : void 0 }),
      /* @__PURE__ */ jsx(Typography, { variant: "caption", color: "text.secondary", sx: {
        mt: 0.5
      }, children: getStatusMessage(state, progress) })
    ] }),
    /* @__PURE__ */ jsx("input", { ref: fileInputRef, type: "file", accept, style: {
      display: "none"
    }, onChange: handleFileSelect, disabled: isUploading }),
    validationError && /* @__PURE__ */ jsx(FormHelperText, { error: true, children: validationError.message }),
    uploadError && /* @__PURE__ */ jsx(Alert, { severity: "error", sx: {
      py: 0.5
    }, children: uploadError }),
    /* @__PURE__ */ jsxs(Stack, { direction: "row", spacing: 1, children: [
      /* @__PURE__ */ jsx(Button, { variant: "outlined", onClick: handleSelectClick, startIcon: /* @__PURE__ */ jsx(Upload, {}), disabled: isUploading, fullWidth: true, children: isUploading ? "Uploading..." : "Select Image" }),
      (previewUrl || isUploading) && /* @__PURE__ */ jsx(Button, { variant: "outlined", color: "error", onClick: handleRemove, startIcon: /* @__PURE__ */ jsx(Delete, {}), disabled: false, children: isUploading ? "Cancel" : "Remove" })
    ] }),
    helperText && !hasError && /* @__PURE__ */ jsx(FormHelperText, { children: helperText })
  ] });
};
export {
  DocumentImageUploadField,
  DocumentImageUploadField as default
};
//# sourceMappingURL=index.js.map
