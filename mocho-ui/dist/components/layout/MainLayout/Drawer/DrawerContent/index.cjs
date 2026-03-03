"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const index = require("./Navigation/index.cjs");
const SimpleBar = require("../../../../third-party/SimpleBar.cjs");
const DrawerContent = ({
  menuItems = [],
  children
}) => /* @__PURE__ */ jsxRuntime.jsx(SimpleBar, { sx: {
  "& .simplebar-content": {
    display: "flex",
    flexDirection: "column"
  }
}, children: children ?? /* @__PURE__ */ jsxRuntime.jsx(index, { menuItems }) });
module.exports = DrawerContent;
//# sourceMappingURL=index.cjs.map
