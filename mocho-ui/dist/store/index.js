import { useCallback } from "react";
import { useLayout } from "../components/layout/LayoutContext.js";
import { useMenu } from "../components/layout/LayoutContext.js";
function useSelector(selector) {
  const {
    menu
  } = useLayout();
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
  } = useLayout();
  const dispatchFn = useCallback((action) => {
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
export {
  dispatch,
  useDispatch,
  useLayout,
  useMenu,
  useSelector
};
//# sourceMappingURL=index.js.map
