"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const SimpleBarReact = require("simplebar-react");
const material = require("@mui/material");
require("simplebar-react/dist/simplebar.min.css");
const SimpleBar = ({
  children,
  sx,
  ...props
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(material.Box, { component: SimpleBarReact, sx: {
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
