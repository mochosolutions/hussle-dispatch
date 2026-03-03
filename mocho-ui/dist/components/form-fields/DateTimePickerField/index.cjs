"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const material = require("@mui/material");
const DateTimePicker = require("@mui/x-date-pickers/DateTimePicker");
const DateTimePickerField = ({
  name,
  label,
  required = false,
  helperText,
  minDate,
  maxDate,
  formik
}) => {
  const value = formik.values[name] || null;
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const hasError = Boolean(touched && error);
  const handleChange = React.useCallback((newValue) => {
    formik.setFieldValue(name, newValue);
  }, [formik, name]);
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.InputLabel, { htmlFor: name, required, children: label }),
    /* @__PURE__ */ jsxRuntime.jsx(DateTimePicker.DateTimePicker, { value, onChange: handleChange, minDate, maxDate, slotProps: {
      textField: {
        id: name,
        name,
        fullWidth: true,
        error: hasError,
        onBlur: formik.handleBlur
      }
    } }),
    hasError && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { error: true, children: error }),
    helperText && !hasError && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { children: helperText })
  ] });
};
exports.DateTimePickerField = DateTimePickerField;
//# sourceMappingURL=index.cjs.map
