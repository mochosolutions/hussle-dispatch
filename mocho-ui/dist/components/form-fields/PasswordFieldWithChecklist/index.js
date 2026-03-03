import { jsxs, Fragment, jsx } from "@emotion/react/jsx-runtime";
import { Grid, Box, Typography } from "@mui/material";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { PasswordField } from "../PasswordField/index.js";
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
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PasswordField, { name, formik, ...rest }),
    /* @__PURE__ */ jsx(Grid, { container: true, spacing: 2, sx: {
      mt: 1
    }, children: validationRules.map((rule, index) => {
      const isValid = rule.test(passwordValue);
      return /* @__PURE__ */ jsx(Grid, { item: true, xs: 12, children: /* @__PURE__ */ jsxs(Box, { display: "flex", flexDirection: "row", alignItems: "center", children: [
        /* @__PURE__ */ jsx(Box, { children: isValid ? /* @__PURE__ */ jsx(CheckCircleOutlined, { style: {
          color: "green"
        } }) : /* @__PURE__ */ jsx(CloseCircleOutlined, { style: {
          color: "red"
        } }) }),
        /* @__PURE__ */ jsx(Typography, { variant: "subtitle1", fontSize: "0.75rem", sx: {
          ml: 1
        }, children: rule.label })
      ] }) }, index);
    }) })
  ] });
};
export {
  PasswordFieldWithChecklist
};
//# sourceMappingURL=index.js.map
