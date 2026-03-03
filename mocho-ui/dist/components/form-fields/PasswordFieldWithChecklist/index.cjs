"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const icons = require("@ant-design/icons");
const index = require("../PasswordField/index.cjs");
const defaultValidationRules = [{
  test: (str) => str.length >= 8,
  label: "8-character minimum length"
}, {
  test: (str) => /[0-9]/.test(str),
  label: "Contains at least 1 number"
}, {
  test: (str) => /[a-z]/.test(str) && /[A-Z]/.test(str),
  label: "Contains at least 1 upper and lowercase letter"
}, {
  test: (str) => /[!#@$%^&*)(+=._-]/.test(str),
  label: "Contains at least 1 special character"
}];
const PasswordFieldWithChecklist = ({
  validationRules = defaultValidationRules,
  formik,
  name,
  ...rest
}) => {
  const passwordValue = formik.values[name] || "";
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(index.PasswordField, { name, formik, ...rest }),
    /* @__PURE__ */ jsxRuntime.jsx(material.Grid, { container: true, spacing: 2, sx: {
      mt: 1
    }, children: validationRules.map((rule, index2) => {
      const isValid = rule.test(passwordValue);
      return /* @__PURE__ */ jsxRuntime.jsx(material.Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { display: "flex", flexDirection: "row", alignItems: "center", children: [
        /* @__PURE__ */ jsxRuntime.jsx(material.Box, { children: isValid ? /* @__PURE__ */ jsxRuntime.jsx(icons.CheckCircleOutlined, { style: {
          color: "green"
        } }) : /* @__PURE__ */ jsxRuntime.jsx(icons.CloseCircleOutlined, { style: {
          color: "red"
        } }) }),
        /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "subtitle1", fontSize: "0.75rem", sx: {
          ml: 1
        }, children: rule.label })
      ] }) }, index2);
    }) })
  ] });
};
exports.PasswordFieldWithChecklist = PasswordFieldWithChecklist;
//# sourceMappingURL=index.cjs.map
