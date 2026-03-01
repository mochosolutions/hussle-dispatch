var ImagePath = /* @__PURE__ */ ((ImagePath2) => {
  ImagePath2["LANDING"] = "landing";
  ImagePath2["USERS"] = "users";
  ImagePath2["ECOMMERCE"] = "e-commerce";
  ImagePath2["PROFILE"] = "profile";
  return ImagePath2;
})(ImagePath || {});
function getImageUrl(name, path) {
  return new URL((/* @__PURE__ */ Object.assign({}))[`/src/assets/images/${path}/${name}`], import.meta.url).href;
}
export {
  ImagePath,
  getImageUrl
};
//# sourceMappingURL=getImageUrl.js.map
