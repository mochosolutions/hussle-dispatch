import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { useCallback } from "react";
import { Stack, InputLabel, FormHelperText } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
const DateTimePickerField = ({
  name,
  label,
  required = false,
  helperText,
  minDate,
  maxDate,
  formik
}) => {
  const value = formik.values[name] || null;
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const hasError = Boolean(touched && error);
  const handleChange = useCallback((newValue) => {
    formik.setFieldValue(name, newValue);
  }, [formik, name]);
  return /* @__PURE__ */ jsxs(Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsx(InputLabel, { htmlFor: name, required, children: label }),
    /* @__PURE__ */ jsx(DateTimePicker, { value, onChange: handleChange, minDate, maxDate, slotProps: {
      textField: {
        id: name,
        name,
        fullWidth: true,
        error: hasError,
        onBlur: formik.handleBlur
      }
    } }),
    hasError && /* @__PURE__ */ jsx(FormHelperText, { error: true, children: error }),
    helperText && !hasError && /* @__PURE__ */ jsx(FormHelperText, { children: helperText })
  ] });
};
export {
  DateTimePickerField
};
//# sourceMappingURL=index.js.map
