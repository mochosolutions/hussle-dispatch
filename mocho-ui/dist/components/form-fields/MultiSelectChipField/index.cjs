"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const material = require("@mui/material");
const index = require("../BaseFieldWrapper/index.cjs");
const MultiSelectChipField = ({
  name,
  label,
  options,
  required = false,
  formik
}) => {
  const value = formik.values[name] || [];
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const handleChange = React.useCallback((event) => {
    formik.setFieldValue(name, event.target.value);
  }, [formik, name]);
  const getLabel = React.useCallback((val) => {
    const option = options.find((opt) => opt.value === val);
    return option?.label || val;
  }, [options]);
  return /* @__PURE__ */ jsxRuntime.jsx(index.BaseFieldWrapper, { name, label, required, error, touched, children: /* @__PURE__ */ jsxRuntime.jsx(material.Select, { id: name, name, multiple: true, value, onChange: handleChange, onBlur: formik.handleBlur, fullWidth: true, error: Boolean(touched && error), renderValue: (selected) => /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: {
    display: "flex",
    flexWrap: "wrap",
    gap: 0.5
  }, children: selected.map((val) => /* @__PURE__ */ jsxRuntime.jsx(material.Chip, { label: getLabel(val), size: "small" }, val)) }), children: options.map((option) => /* @__PURE__ */ jsxRuntime.jsx(material.MenuItem, { value: option.value, children: option.label }, option.value)) }) });
};
exports.MultiSelectChipField = MultiSelectChipField;
//# sourceMappingURL=index.cjs.map
