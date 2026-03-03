"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const material = require("@mui/material");
const icons = require("@ant-design/icons");
const index = require("../BaseFieldWrapper/index.cjs");
const PasswordField = ({
  name,
  label,
  placeholder = "Enter password",
  required = false,
  enableToggle = true,
  formik
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  return /* @__PURE__ */ jsxRuntime.jsx(index.BaseFieldWrapper, { name, label, required, error, touched, children: /* @__PURE__ */ jsxRuntime.jsx(material.OutlinedInput, { id: name, name, type: showPassword ? "text" : "password", value: formik.values[name] || "", onChange: formik.handleChange, onBlur: formik.handleBlur, placeholder, fullWidth: true, error: Boolean(touched && error), endAdornment: enableToggle ? /* @__PURE__ */ jsxRuntime.jsx(material.InputAdornment, { position: "end", children: /* @__PURE__ */ jsxRuntime.jsx(material.IconButton, { "aria-label": "toggle password visibility", onClick: handleClickShowPassword, onMouseDown: handleMouseDownPassword, edge: "end", size: "small", children: showPassword ? /* @__PURE__ */ jsxRuntime.jsx(icons.EyeOutlined, {}) : /* @__PURE__ */ jsxRuntime.jsx(icons.EyeInvisibleOutlined, {}) }) }) : void 0 }) });
};
exports.PasswordField = PasswordField;
//# sourceMappingURL=index.cjs.map
