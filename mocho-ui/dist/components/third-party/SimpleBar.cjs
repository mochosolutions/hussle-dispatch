"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const SimpleBarReact = require("simplebar-react");
const material = require("@mui/material");
;/* empty css                                                          */
const SimpleBar = ({
  children,
  sx,
  ...props
}) => {
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { component: SimpleBarReact, sx: {
    maxHeight: "100%",
    "& .simplebar-scrollbar::before": {
      backgroundColor: "grey.500"
    },
    "& .simplebar-track.simplebar-vertical": {
      width: 10
    },
    "& .simplebar-track.simplebar-horizontal": {
      height: 10
    },
    ...sx
  }, ...props, children });
};
module.exports = SimpleBar;
//# sourceMappingURL=SimpleBar.cjs.map
