"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const lab = require("@mui/lab");
const AnimateButton = require("../../extended/AnimateButton.cjs");
const SubmitButton = ({
  label,
  loading,
  disabled = false,
  fullWidth = true,
  size = "large",
  type = "submit"
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(AnimateButton, { children: /* @__PURE__ */ jsxRuntime.jsx(lab.LoadingButton, { disableElevation: true, disabled: disabled || loading, loading, fullWidth, size, type, variant: "contained", color: "primary", children: label }) });
};
exports.SubmitButton = SubmitButton;
//# sourceMappingURL=index.cjs.map
