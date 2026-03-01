"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function generateSlug(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}
exports.generateSlug = generateSlug;
//# sourceMappingURL=slugify.cjs.map
