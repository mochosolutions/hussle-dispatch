"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const React = require("react");
const reactRouterDom = require("react-router-dom");
const useDirtyFormBlocker = ({
  isDirty,
  isSubmitting = false,
  message = "You have unsaved changes. Are you sure you want to leave? Your changes will be lost.",
  title = "Unsaved Changes",
  onBlock
}) => {
  const blocker = reactRouterDom.useBlocker(({
    currentLocation,
    nextLocation
  }) => isDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname);
  React.useEffect(() => {
    if (blocker.state === "blocked" && onBlock) {
      onBlock(blocker, title, message);
    }
  }, [blocker.state, blocker, title, message, onBlock]);
  React.useEffect(() => {
    if (isDirty && !isSubmitting) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = "";
        return "";
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [isDirty, isSubmitting]);
  return blocker;
};
exports.default = useDirtyFormBlocker;
exports.useDirtyFormBlocker = useDirtyFormBlocker;
//# sourceMappingURL=useDirtyFormBlocker.cjs.map
