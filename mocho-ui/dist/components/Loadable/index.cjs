"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const Loader = require("./Loader.cjs");
const Loadable = (Component) => (props) => /* @__PURE__ */ jsxRuntime.jsx(React.Suspense, { fallback: /* @__PURE__ */ jsxRuntime.jsx(Loader, {}), children: /* @__PURE__ */ jsxRuntime.jsx(Component, { ...props }) });
module.exports = Loadable;
//# sourceMappingURL=index.cjs.map
