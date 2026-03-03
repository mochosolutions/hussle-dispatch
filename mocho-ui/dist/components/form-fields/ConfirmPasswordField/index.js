import { jsx } from "@emotion/react/jsx-runtime";
import { PasswordField } from "../PasswordField/index.js";
const ConfirmPasswordField = ({
  name,
  label = "Confirm Password",
  placeholder = "Enter confirm password",
  enableToggle = true,
  ...rest
}) => {
  return /* @__PURE__ */ jsx(PasswordField, { name, label, placeholder, enableToggle, ...rest });
};
export {
  ConfirmPasswordField
};
//# sourceMappingURL=index.js.map
