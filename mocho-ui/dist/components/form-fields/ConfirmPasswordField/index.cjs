"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const index = require("../PasswordField/index.cjs");
const ConfirmPasswordField = ({
  name,
  label = "Confirm Password",
  placeholder = "Enter confirm password",
  enableToggle = true,
  ...rest
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(index.PasswordField, { name, label, placeholder, enableToggle, ...rest });
};
exports.ConfirmPasswordField = ConfirmPasswordField;
//# sourceMappingURL=index.cjs.map
