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
export {
  activeID,
  activeItem,
  openDrawer
};
//# sourceMappingURL=menu.js.map
