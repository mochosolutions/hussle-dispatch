"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const DOMPurify = require("dompurify");
function createMarkup(dirty) {
  return {
    __html: DOMPurify.sanitize(dirty)
  };
}
exports.createMarkup = createMarkup;
//# sourceMappingURL=createMarkup.cjs.map
