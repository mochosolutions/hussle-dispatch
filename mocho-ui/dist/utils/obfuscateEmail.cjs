"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const obfuscateEmail = (email) => {
  console.log("email", email);
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) {
    return "";
  }
  const obfuscatedLocalPart = localPart[0] + "*".repeat(localPart.length - 1);
  return `${obfuscatedLocalPart}@${domainPart}`;
};
exports.obfuscateEmail = obfuscateEmail;
//# sourceMappingURL=obfuscateEmail.cjs.map
