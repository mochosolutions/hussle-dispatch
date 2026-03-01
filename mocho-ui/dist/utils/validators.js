import * as Yup from "yup";
const passwordValidation = Yup.string().required("Password is required").min(8, "Password must be at least 8 characters long").matches(/[0-9]/, "Password must contain at least one number").matches(/[A-Z]/, "Password must contain at least one uppercase letter").matches(/[a-z]/, "Password must contain at least one lowercase letter");
const nameValidation = (fieldName) => Yup.string().required(`${fieldName} is required`).trim().min(2, `${fieldName} must be at least 2 characters long`).max(50, `${fieldName} must be at most 50 characters long`);
const longerNameValidation = (fieldName) => Yup.string().required(`${fieldName} is required`).trim().min(2, `${fieldName} must be at least 2 characters long`).max(100, `${fieldName} must be at most 100 characters long`);
const emailValidation = Yup.string().email("Invalid email address").required("Email is required").trim().lowercase();
const registerValidation = Yup.object({
  email: emailValidation,
  // password: passwordValidation,
  firstName: nameValidation("First Name").optional().nullable().notOneOf([""], "First Name cannot be an empty string"),
  lastName: nameValidation("Last Name").optional().nullable().notOneOf([""], "Last Name cannot be an empty string"),
  name: longerNameValidation("Company Name").optional().nullable().notOneOf([""], "Company Name cannot be an empty string")
});
const updateValidation = Yup.object({
  contactEmail: emailValidation.optional().nullable().notOneOf(["", null], "Email cannot be empty or null"),
  name: longerNameValidation("Company Name").optional().nullable().notOneOf(["", null], "Company Name cannot be empty or null")
});
const loginValidation = Yup.object().shape({
  email: emailValidation,
  password: passwordValidation,
  rememeberMe: Yup.boolean().optional()
});
const confirmationCodeValidation = Yup.object({
  password: passwordValidation,
  confirmPassword: Yup.string().required("Confirm Password is required").test("confirmPassword", "Both Password must be match!", (confirmationCode, yup) => yup.parent.password === confirmationCode),
  confirmationCode: Yup.string().required("OTP is required").length(6, "OTP must be 6 digits")
});
const initiatePasswordResetValidation = Yup.object().shape({
  email: emailValidation
});
export {
  confirmationCodeValidation,
  emailValidation,
  initiatePasswordResetValidation,
  loginValidation,
  longerNameValidation,
  nameValidation,
  passwordValidation,
  registerValidation,
  updateValidation
};
//# sourceMappingURL=validators.js.map
