"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function isNumber(value) {
  return new RegExp("^(?=.*[0-9]).+$").test(value);
}
function isLowercaseChar(value) {
  return new RegExp("^(?=.*[a-z]).+$").test(value);
}
function isUppercaseChar(value) {
  return new RegExp("^(?=.*[A-Z]).+$").test(value);
}
function isSpecialChar(value) {
  return new RegExp("^(?=.*[-+_!@#$%^&*.,?]).+$").test(value);
}
function minLength(value) {
  return value.length > 7;
}
exports.isLowercaseChar = isLowercaseChar;
exports.isNumber = isNumber;
exports.isSpecialChar = isSpecialChar;
exports.isUppercaseChar = isUppercaseChar;
exports.minLength = minLength;
//# sourceMappingURL=password-validation.cjs.map
