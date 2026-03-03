import { jsx } from "@emotion/react/jsx-runtime";
import { LoadingButton } from "@mui/lab";
import AnimateButton from "../../extended/AnimateButton.js";
const SubmitButton = ({
  label,
  loading,
  disabled = false,
  fullWidth = true,
  size = "large",
  type = "submit"
}) => {
  return /* @__PURE__ */ jsx(AnimateButton, { children: /* @__PURE__ */ jsx(LoadingButton, { disableElevation: true, disabled: disabled || loading, loading, fullWidth, size, type, variant: "contained", color: "primary", children: label }) });
};
export {
  SubmitButton
};
//# sourceMappingURL=index.js.map
