"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const material = require("@mui/material");
const index = require("../PasswordField/index.cjs");
const passwordStrength = require("../../../utils/password-strength.cjs");
const PasswordFieldWithStrength = ({
  showStrengthMeter = true,
  formik,
  name,
  ...rest
}) => {
  const [level, setLevel] = React.useState();
  React.useEffect(() => {
    const password = formik.values[name] || "";
    const temp = passwordStrength.strengthIndicator(password);
    setLevel(passwordStrength.strengthColor(temp));
  }, [formik.values[name], name]);
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(index.PasswordField, { name, formik, ...rest }),
    showStrengthMeter && level && /* @__PURE__ */ jsxRuntime.jsx(material.FormControl, { fullWidth: true, sx: {
      mt: 2
    }, children: /* @__PURE__ */ jsxRuntime.jsxs(material.Grid, { container: true, spacing: 2, alignItems: "center", children: [
      /* @__PURE__ */ jsxRuntime.jsx(material.Grid, { item: true, children: /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: {
        bgcolor: level.color,
        width: 85,
        height: 8,
        borderRadius: "7px"
      } }) }),
      /* @__PURE__ */ jsxRuntime.jsx(material.Grid, { item: true, children: /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "subtitle1", fontSize: "0.75rem", children: level.label }) })
    ] }) })
  ] });
};
exports.PasswordFieldWithStrength = PasswordFieldWithStrength;
//# sourceMappingURL=index.cjs.map
