"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const index = require("../../../_virtual/index.cjs");
const config = require("../../../types/config.cjs");
const OTPField = ({
  name,
  label,
  numDigits = 6,
  formik
}) => {
  const theme = styles.useTheme();
  const borderColor = theme.palette.mode === config.ThemeMode.DARK ? theme.palette.grey[200] : theme.palette.grey[300];
  const error = formik.errors[name];
  const touched = formik.touched[name];
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 1, children: [
    label && /* @__PURE__ */ jsxRuntime.jsx(material.InputLabel, { children: label }),
    /* @__PURE__ */ jsxRuntime.jsx(index, { value: formik.values[name] || "", onChange: (otp) => formik.setFieldValue(name, otp), numInputs: numDigits, containerStyle: {
      justifyContent: "space-between"
    }, inputStyle: {
      width: "100%",
      margin: "8px",
      padding: "10px",
      border: `1px solid ${borderColor}`,
      borderRadius: 4
    }, focusStyle: {
      outline: "none",
      boxShadow: theme.customShadows?.primary,
      border: `1px solid ${theme.palette.primary.main}`
    } }),
    touched && error && /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { color: "error", variant: "body2", children: error })
  ] });
};
exports.OTPField = OTPField;
//# sourceMappingURL=index.cjs.map
