import { useContext } from "react";
import { LayoutStateContext } from "../contexts/LayoutStateContext.js";
const useLayoutState = () => {
  const context = useContext(LayoutStateContext);
  if (context === null) {
    throw new Error("useLayoutState must be used within a LayoutStateProvider");
  }
  return context;
};
export {
  useLayoutState as default
};
//# sourceMappingURL=useLayoutState.js.map
