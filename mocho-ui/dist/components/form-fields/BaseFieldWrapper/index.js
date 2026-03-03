import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { Stack, InputLabel, FormHelperText } from "@mui/material";
const BaseFieldWrapper = ({
  name,
  label,
  required = false,
  error,
  touched,
  helperText,
  children
}) => {
  const hasError = Boolean(touched && error);
  return /* @__PURE__ */ jsxs(Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsx(InputLabel, { htmlFor: name, required, children: label }),
    children,
    hasError && /* @__PURE__ */ jsx(FormHelperText, { error: true, id: `helper-text-${name}`, children: error }),
    !hasError && helperText && /* @__PURE__ */ jsx(FormHelperText, { id: `helper-text-${name}`, children: helperText })
  ] });
};
export {
  BaseFieldWrapper
};
//# sourceMappingURL=index.js.map
