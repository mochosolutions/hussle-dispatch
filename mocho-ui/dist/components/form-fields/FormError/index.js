import { jsx } from "@emotion/react/jsx-runtime";
import { Grid, FormHelperText } from "@mui/material";
const FormError = ({
  error
}) => {
  if (!error) return null;
  return /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsx(FormHelperText, { error: true, children: error }) });
};
export {
  FormError
};
//# sourceMappingURL=index.js.map
