"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function openDrawer(open) {
  return {
    type: "menu/openDrawer",
    payload: open
  };
}
function activeID(id) {
  return {
    type: "menu/activeID",
    payload: id
  };
}
function activeItem(items) {
  return {
    type: "menu/activeItem",
    payload: items
  };
}
exports.activeID = activeID;
exports.activeItem = activeItem;
exports.openDrawer = openDrawer;
//# sourceMappingURL=menu.cjs.map
