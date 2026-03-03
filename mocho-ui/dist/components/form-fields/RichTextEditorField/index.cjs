"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const material = require("@mui/material");
const index = require("../../TiptapEditor/index.cjs");
const RichTextEditorField = ({
  name,
  label,
  required = false,
  placeholder,
  minHeight = 400,
  maxHeight = 600,
  onImageSelect,
  formik
}) => {
  const value = formik.values[name] || "";
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const hasError = Boolean(touched && error);
  const handleChange = React.useCallback((html) => {
    formik.setFieldValue(name, html);
  }, [formik, name]);
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.InputLabel, { required, children: label }),
    /* @__PURE__ */ jsxRuntime.jsx(index.TiptapEditor, { value, onChange: handleChange, onImageSelect, placeholder, minHeight, maxHeight, error: hasError, helperText: hasError ? error : void 0 })
  ] });
};
exports.RichTextEditorField = RichTextEditorField;
//# sourceMappingURL=index.cjs.map
