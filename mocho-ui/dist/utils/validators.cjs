"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const Yup = require("yup");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const Yup__namespace = /* @__PURE__ */ _interopNamespaceDefault(Yup);
const passwordValidation = Yup__namespace.string().required("Password is required").min(8, "Password must be at least 8 characters long").matches(/[0-9]/, "Password must contain at least one number").matches(/[A-Z]/, "Password must contain at least one uppercase letter").matches(/[a-z]/, "Password must contain at least one lowercase letter");
const nameValidation = (fieldName) => Yup__namespace.string().required(`${fieldName} is required`).trim().min(2, `${fieldName} must be at least 2 characters long`).max(50, `${fieldName} must be at most 50 characters long`);
const longerNameValidation = (fieldName) => Yup__namespace.string().required(`${fieldName} is required`).trim().min(2, `${fieldName} must be at least 2 characters long`).max(100, `${fieldName} must be at most 100 characters long`);
const emailValidation = Yup__namespace.string().email("Invalid email address").required("Email is required").trim().lowercase();
const registerValidation = Yup__namespace.object({
  email: emailValidation,
  // password: passwordValidation,
  firstName: nameValidation("First Name").optional().nullable().notOneOf([""], "First Name cannot be an empty string"),
  lastName: nameValidation("Last Name").optional().nullable().notOneOf([""], "Last Name cannot be an empty string"),
  name: longerNameValidation("Company Name").optional().nullable().notOneOf([""], "Company Name cannot be an empty string")
});
const updateValidation = Yup__namespace.object({
  contactEmail: emailValidation.optional().nullable().notOneOf(["", null], "Email cannot be empty or null"),
  name: longerNameValidation("Company Name").optional().nullable().notOneOf(["", null], "Company Name cannot be empty or null")
});
const loginValidation = Yup__namespace.object().shape({
  email: emailValidation,
  password: passwordValidation,
  rememeberMe: Yup__namespace.boolean().optional()
});
const confirmationCodeValidation = Yup__namespace.object({
  password: passwordValidation,
  confirmPassword: Yup__namespace.string().required("Confirm Password is required").test("confirmPassword", "Both Password must be match!", (confirmationCode, yup) => yup.parent.password === confirmationCode),
  confirmationCode: Yup__namespace.string().required("OTP is required").length(6, "OTP must be 6 digits")
});
const initiatePasswordResetValidation = Yup__namespace.object().shape({
  email: emailValidation
});
exports.confirmationCodeValidation = confirmationCodeValidation;
exports.emailValidation = emailValidation;
exports.initiatePasswordResetValidation = initiatePasswordResetValidation;
exports.loginValidation = loginValidation;
exports.longerNameValidation = longerNameValidation;
exports.nameValidation = nameValidation;
exports.passwordValidation = passwordValidation;
exports.registerValidation = registerValidation;
exports.updateValidation = updateValidation;
//# sourceMappingURL=validators.cjs.map
