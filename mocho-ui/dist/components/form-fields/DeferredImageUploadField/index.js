import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import { Stack, InputLabel, Box, Typography, FormHelperText, Button } from "@mui/material";
import { Image, Upload, Delete } from "@mui/icons-material";
import { validateImageBeforeUpload } from "../../../utils/imageUploadErrors.js";
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
  const [previewUrl, setPreviewUrl] = useState(heroImageState?.blobUrl || existingUrl);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (heroImageState?.blobUrl) {
      setPreviewUrl(heroImageState.blobUrl);
    } else if (existingUrl && !heroImageState) {
      setPreviewUrl(existingUrl);
    }
  }, [existingUrl, heroImageState]);
  useEffect(() => {
    return () => {
      if (heroImageState?.blobUrl) {
        URL.revokeObjectURL(heroImageState.blobUrl);
      }
    };
  }, []);
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
  const handleRemove = useCallback(() => {
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
  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const hasNewImage = !!heroImageState;
  const hasExistingImage = !!existingUrl && !hasNewImage;
  const hasAnyImage = hasNewImage || hasExistingImage;
  return /* @__PURE__ */ jsxs(Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsx(InputLabel, { children: label }),
    /* @__PURE__ */ jsxs(Box, { sx: {
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
      previewUrl ? /* @__PURE__ */ jsx(Box, { component: "img", src: previewUrl, alt: "Preview", sx: {
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
      ] }),
      hasNewImage && /* @__PURE__ */ jsx(Typography, { variant: "caption", sx: {
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
    /* @__PURE__ */ jsx("input", { ref: fileInputRef, type: "file", accept, style: {
      display: "none"
    }, onChange: handleFileSelect }),
    validationError && /* @__PURE__ */ jsx(FormHelperText, { error: true, children: validationError.message }),
    /* @__PURE__ */ jsxs(Stack, { direction: "row", spacing: 1, children: [
      /* @__PURE__ */ jsx(Button, { variant: "outlined", onClick: handleSelectClick, startIcon: /* @__PURE__ */ jsx(Upload, {}), fullWidth: true, children: hasAnyImage ? "Change Image" : "Select Image" }),
      hasAnyImage && /* @__PURE__ */ jsx(Button, { variant: "outlined", color: "error", onClick: handleRemove, startIcon: /* @__PURE__ */ jsx(Delete, {}), children: "Remove" })
    ] }),
    helperText && !validationError && /* @__PURE__ */ jsx(FormHelperText, { children: helperText })
  ] });
};
export {
  DeferredImageUploadField,
  DeferredImageUploadField as default
};
//# sourceMappingURL=index.js.map
