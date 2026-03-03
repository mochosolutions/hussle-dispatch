"use strict";
const React = require("react");
const LayoutStateContext = require("../contexts/LayoutStateContext.cjs");
const useLayoutState = () => {
  const context = React.useContext(LayoutStateContext.LayoutStateContext);
  if (context === null) {
    throw new Error("useLayoutState must be used within a LayoutStateProvider");
  }
  return context;
};
module.exports = useLayoutState;
//# sourceMappingURL=useLayoutState.cjs.map
