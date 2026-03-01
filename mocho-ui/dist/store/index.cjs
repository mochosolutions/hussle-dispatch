"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
const LayoutContext = require("../components/layout/LayoutContext.cjs");
function useSelector(selector) {
  const {
    menu
  } = LayoutContext.useLayout();
  const state = {
    menu
  };
  return selector(state);
}
function dispatch(action) {
  console.warn("Direct dispatch called - use action creators instead");
}
function useDispatch() {
  const {
    openDrawer,
    activeID,
    activeItem
  } = LayoutContext.useLayout();
  const dispatchFn = React.useCallback((action) => {
    switch (action.type) {
      case "menu/openDrawer":
        openDrawer(action.payload);
        break;
      case "menu/activeID":
        activeID(action.payload);
        break;
      case "menu/activeItem":
        activeItem(action.payload);
        break;
    }
  }, [openDrawer, activeID, activeItem]);
  return dispatchFn;
}
exports.useLayout = LayoutContext.useLayout;
exports.useMenu = LayoutContext.useMenu;
exports.dispatch = dispatch;
exports.useDispatch = useDispatch;
exports.useSelector = useSelector;
//# sourceMappingURL=index.cjs.map
