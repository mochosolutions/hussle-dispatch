import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import { Stack, InputLabel, Box, Typography, FormHelperText, Button } from "@mui/material";
import { Image, Upload, Delete } from "@mui/icons-material";
import { validateImageBeforeUpload } from "../../../utils/imageUploadErrors.js";
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
  const [previewUrl, setPreviewUrl] = useState(existingUrl);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (existingUrl && !previewUrl) {
      setPreviewUrl(existingUrl);
    }
  }, [existingUrl, previewUrl]);
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  const handleFileSelect = useCallback((event) => {
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
  const handleRemove = useCallback(() => {
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
  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  return /* @__PURE__ */ jsxs(Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsx(InputLabel, { children: label }),
    /* @__PURE__ */ jsx(Box, { sx: {
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
    }, children: previewUrl ? /* @__PURE__ */ jsx(Box, { component: "img", src: previewUrl, alt: "Preview", sx: {
      maxWidth: "100%",
      maxHeight: previewHeight,
      objectFit: "contain",
      borderRadius: 1
    } }) : /* @__PURE__ */ jsxs(Stack, { spacing: 1, alignItems: "center", children: [
      /* @__PURE__ */ jsx(Image, { sx: {
        fontSize: 48,
        color: "text.disabled"
      } }),
      /* @__PURE__ */ jsx(Typography, { color: "text.secondary", variant: "body2", children: "No image selected" })
    ] }) }),
    /* @__PURE__ */ jsx("input", { ref: fileInputRef, type: "file", accept, style: {
      display: "none"
    }, onChange: handleFileSelect }),
    validationError && /* @__PURE__ */ jsx(FormHelperText, { error: true, children: validationError.message }),
    /* @__PURE__ */ jsxs(Stack, { direction: "row", spacing: 1, children: [
      /* @__PURE__ */ jsx(Button, { variant: "outlined", onClick: handleSelectClick, startIcon: /* @__PURE__ */ jsx(Upload, {}), fullWidth: true, children: "Select Image" }),
      previewUrl && /* @__PURE__ */ jsx(Button, { variant: "outlined", color: "error", onClick: handleRemove, startIcon: /* @__PURE__ */ jsx(Delete, {}), children: "Remove" })
    ] }),
    helperText && /* @__PURE__ */ jsx(FormHelperText, { children: helperText })
  ] });
};
export {
  ImageUploadField
};
//# sourceMappingURL=index.js.map
