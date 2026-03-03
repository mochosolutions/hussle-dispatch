import { jsxs, Fragment, jsx } from "@emotion/react/jsx-runtime";
import { useState, useEffect } from "react";
import { FormControl, Grid, Box, Typography } from "@mui/material";
import { PasswordField } from "../PasswordField/index.js";
import { strengthIndicator, strengthColor } from "../../../utils/password-strength.js";
const PasswordFieldWithStrength = ({
  showStrengthMeter = true,
  formik,
  name,
  ...rest
}) => {
  const [level, setLevel] = useState();
  useEffect(() => {
    const password = formik.values[name] || "";
    const temp = strengthIndicator(password);
    setLevel(strengthColor(temp));
  }, [formik.values[name], name]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PasswordField, { name, formik, ...rest }),
    showStrengthMeter && level && /* @__PURE__ */ jsx(FormControl, { fullWidth: true, sx: {
      mt: 2
    }, children: /* @__PURE__ */ jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [
      /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(Box, { sx: {
        bgcolor: level.color,
        width: 85,
        height: 8,
        borderRadius: "7px"
      } }) }),
      /* @__PURE__ */ jsx(Grid, { item: true, children: /* @__PURE__ */ jsx(Typography, { variant: "subtitle1", fontSize: "0.75rem", children: level.label }) })
    ] }) })
  ] });
};
export {
  PasswordFieldWithStrength
};
//# sourceMappingURL=index.js.map
