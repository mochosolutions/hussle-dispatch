"use strict";
const React = require("react");
const useScriptRef = () => {
  const scripted = React.useRef(true);
  React.useEffect(() => () => {
    scripted.current = false;
  }, []);
  return scripted;
};
module.exports = useScriptRef;
//# sourceMappingURL=useScriptRef.cjs.map
