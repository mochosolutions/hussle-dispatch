"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const index = require("../BaseFieldWrapper/index.cjs");
const SelectField = ({
  name,
  label,
  data,
  required = false,
  formik
}) => {
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const handleChange = (event) => {
    formik.setFieldValue(name, event.target.value);
  };
  return /* @__PURE__ */ jsxRuntime.jsx(index.BaseFieldWrapper, { name, label, required, error, touched, children: /* @__PURE__ */ jsxRuntime.jsx(material.Select, { id: name, name, value: formik.values[name] || "", onChange: handleChange, onBlur: formik.handleBlur, fullWidth: true, error: Boolean(touched && error), children: data.map((item) => /* @__PURE__ */ jsxRuntime.jsx(material.MenuItem, { value: item.value, children: item.label }, item.value)) }) });
};
exports.SelectField = SelectField;
//# sourceMappingURL=index.cjs.map
