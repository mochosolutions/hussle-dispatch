import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { useTheme } from "@mui/material/styles";
import { Stack, InputLabel, Typography } from "@mui/material";
import OtpInput from "../../../_virtual/index.js";
import { ThemeMode } from "../../../types/config.js";
const OTPField = ({
  name,
  label,
  numDigits = 6,
  formik
}) => {
  const theme = useTheme();
  const borderColor = theme.palette.mode === ThemeMode.DARK ? theme.palette.grey[200] : theme.palette.grey[300];
  const error = formik.errors[name];
  const touched = formik.touched[name];
  return /* @__PURE__ */ jsxs(Stack, { spacing: 1, children: [
    label && /* @__PURE__ */ jsx(InputLabel, { children: label }),
    /* @__PURE__ */ jsx(OtpInput, { value: formik.values[name] || "", onChange: (otp) => formik.setFieldValue(name, otp), numInputs: numDigits, containerStyle: {
      justifyContent: "space-between"
    }, inputStyle: {
      width: "100%",
      margin: "8px",
      padding: "10px",
      border: `1px solid ${borderColor}`,
      borderRadius: 4
    }, focusStyle: {
      outline: "none",
      boxShadow: theme.customShadows?.primary,
      border: `1px solid ${theme.palette.primary.main}`
    } }),
    touched && error && /* @__PURE__ */ jsx(Typography, { color: "error", variant: "body2", children: error })
  ] });
};
export {
  OTPField
};
//# sourceMappingURL=index.js.map
