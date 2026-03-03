import { jsx } from "@emotion/react/jsx-runtime";
import { useState } from "react";
import { OutlinedInput, InputAdornment, IconButton } from "@mui/material";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { BaseFieldWrapper } from "../BaseFieldWrapper/index.js";
const PasswordField = ({
  name,
  label,
  placeholder = "Enter password",
  required = false,
  enableToggle = true,
  formik
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  return /* @__PURE__ */ jsx(BaseFieldWrapper, { name, label, required, error, touched, children: /* @__PURE__ */ jsx(OutlinedInput, { id: name, name, type: showPassword ? "text" : "password", value: formik.values[name] || "", onChange: formik.handleChange, onBlur: formik.handleBlur, placeholder, fullWidth: true, error: Boolean(touched && error), endAdornment: enableToggle ? /* @__PURE__ */ jsx(InputAdornment, { position: "end", children: /* @__PURE__ */ jsx(IconButton, { "aria-label": "toggle password visibility", onClick: handleClickShowPassword, onMouseDown: handleMouseDownPassword, edge: "end", size: "small", children: showPassword ? /* @__PURE__ */ jsx(EyeOutlined, {}) : /* @__PURE__ */ jsx(EyeInvisibleOutlined, {}) }) }) : void 0 }) });
};
export {
  PasswordField
};
//# sourceMappingURL=index.js.map
