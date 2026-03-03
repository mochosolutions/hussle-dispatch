import { jsx } from "@emotion/react/jsx-runtime";
import { useCallback } from "react";
import { Select, MenuItem, Box, Chip } from "@mui/material";
import { BaseFieldWrapper } from "../BaseFieldWrapper/index.js";
const MultiSelectChipField = ({
  name,
  label,
  options,
  required = false,
  formik
}) => {
  const value = formik.values[name] || [];
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const handleChange = useCallback((event) => {
    formik.setFieldValue(name, event.target.value);
  }, [formik, name]);
  const getLabel = useCallback((val) => {
    const option = options.find((opt) => opt.value === val);
    return option?.label || val;
  }, [options]);
  return /* @__PURE__ */ jsx(BaseFieldWrapper, { name, label, required, error, touched, children: /* @__PURE__ */ jsx(Select, { id: name, name, multiple: true, value, onChange: handleChange, onBlur: formik.handleBlur, fullWidth: true, error: Boolean(touched && error), renderValue: (selected) => /* @__PURE__ */ jsx(Box, { sx: {
    display: "flex",
    flexWrap: "wrap",
    gap: 0.5
  }, children: selected.map((val) => /* @__PURE__ */ jsx(Chip, { label: getLabel(val), size: "small" }, val)) }), children: options.map((option) => /* @__PURE__ */ jsx(MenuItem, { value: option.value, children: option.label }, option.value)) }) });
};
export {
  MultiSelectChipField
};
//# sourceMappingURL=index.js.map
