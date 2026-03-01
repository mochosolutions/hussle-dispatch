import { useRef, useEffect } from "react";
const useScriptRef = () => {
  const scripted = useRef(true);
  useEffect(() => () => {
    scripted.current = false;
  }, []);
  return scripted;
};
export {
  useScriptRef as default
};
//# sourceMappingURL=useScriptRef.js.map
