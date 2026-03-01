import { useRef, useEffect } from "react";
function useAutoFocus(options = {}) {
  const {
    enabled = true,
    delay = 100,
    selectOnFocus = false,
    checkVisibility = true
  } = options;
  const ref = useRef(null);
  useEffect(() => {
    if (!enabled || !ref.current) {
      return;
    }
    const element = ref.current;
    const focusElement = () => {
      if (checkVisibility) {
        const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0 && window.getComputedStyle(element).visibility !== "hidden";
        if (!isVisible) {
          console.warn("useAutoFocus: Element is not visible, skipping focus");
          return;
        }
      }
      element.focus();
      if (selectOnFocus && "select" in element && typeof element.select === "function") {
        try {
          element.select();
        } catch (error) {
          console.debug("useAutoFocus: Text selection failed", error);
        }
      }
    };
    const timeoutId = setTimeout(focusElement, delay);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, delay, selectOnFocus, checkVisibility]);
  return ref;
}
function useAutoFocusFirst(options = {}) {
  const {
    enabled = true,
    delay = 100,
    checkVisibility = true
  } = options;
  const ref = useRef(null);
  useEffect(() => {
    if (!enabled || !ref.current) {
      return;
    }
    const container = ref.current;
    const focusFirstElement = () => {
      const focusableSelectors = ['input:not([disabled]):not([type="hidden"])', "textarea:not([disabled])", "select:not([disabled])", "button:not([disabled])", '[tabindex]:not([tabindex="-1"])'].join(", ");
      const firstFocusable = container.querySelector(focusableSelectors);
      if (!firstFocusable) {
        console.warn("useAutoFocusFirst: No focusable element found in container");
        return;
      }
      if (checkVisibility) {
        const isVisible = firstFocusable.offsetWidth > 0 && firstFocusable.offsetHeight > 0 && window.getComputedStyle(firstFocusable).visibility !== "hidden";
        if (!isVisible) {
          console.warn("useAutoFocusFirst: First focusable element is not visible");
          return;
        }
      }
      firstFocusable.focus();
    };
    const timeoutId = setTimeout(focusFirstElement, delay);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, delay, checkVisibility]);
  return ref;
}
export {
  useAutoFocus as default,
  useAutoFocus,
  useAutoFocusFirst
};
//# sourceMappingURL=useAutoFocus.js.map
