import { useEffect } from "react";
import { useBlocker } from "react-router-dom";
const useDirtyFormBlocker = ({
  isDirty,
  isSubmitting = false,
  message = "You have unsaved changes. Are you sure you want to leave? Your changes will be lost.",
  title = "Unsaved Changes",
  onBlock
}) => {
  const blocker = useBlocker(({
    currentLocation,
    nextLocation
  }) => isDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state === "blocked" && onBlock) {
      onBlock(blocker, title, message);
    }
  }, [blocker.state, blocker, title, message, onBlock]);
  useEffect(() => {
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
export {
  useDirtyFormBlocker as default,
  useDirtyFormBlocker
};
//# sourceMappingURL=useDirtyFormBlocker.js.map
