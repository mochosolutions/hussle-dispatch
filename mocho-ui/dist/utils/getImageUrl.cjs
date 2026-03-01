"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
var ImagePath = /* @__PURE__ */ ((ImagePath2) => {
  ImagePath2["LANDING"] = "landing";
  ImagePath2["USERS"] = "users";
  ImagePath2["ECOMMERCE"] = "e-commerce";
  ImagePath2["PROFILE"] = "profile";
  return ImagePath2;
})(ImagePath || {});
function getImageUrl(name, path) {
  return new URL((/* @__PURE__ */ Object.assign({}))[`/src/assets/images/${path}/${name}`], typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("utils/getImageUrl.cjs", document.baseURI).href).href;
}
exports.ImagePath = ImagePath;
exports.getImageUrl = getImageUrl;
//# sourceMappingURL=getImageUrl.cjs.map
