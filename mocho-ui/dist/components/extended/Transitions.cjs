"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const material = require("@mui/material");
const Transitions = React.forwardRef(({
  children,
  position = "top-left",
  sx,
  type = "grow",
  direction = "up",
  ...others
}, ref) => {
  let positionSX = {
    transformOrigin: "0 0 0"
  };
  switch (position) {
    case "top-right":
      positionSX = {
        transformOrigin: "top right"
      };
      break;
    case "top":
      positionSX = {
        transformOrigin: "top"
      };
      break;
    case "bottom-left":
      positionSX = {
        transformOrigin: "bottom left"
      };
      break;
    case "bottom-right":
      positionSX = {
        transformOrigin: "bottom right"
      };
      break;
    case "bottom":
      positionSX = {
        transformOrigin: "bottom"
      };
      break;
    case "top-left":
    default:
      positionSX = {
        transformOrigin: "0 0 0"
      };
      break;
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { ref, children: [
    type === "grow" && /* @__PURE__ */ jsxRuntime.jsx(material.Grow, { ...others, timeout: {
      appear: 0,
      enter: 150,
      exit: 150
    }, children: /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: positionSX, children }) }),
    type === "collapse" && /* @__PURE__ */ jsxRuntime.jsx(material.Collapse, { ...others, sx: positionSX, children }),
    type === "fade" && /* @__PURE__ */ jsxRuntime.jsx(material.Fade, { ...others, timeout: {
      appear: 0,
      enter: 300,
      exit: 150
    }, children: /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: positionSX, children }) }),
    type === "slide" && /* @__PURE__ */ jsxRuntime.jsx(material.Slide, { ...others, timeout: {
      appear: 0,
      enter: 150,
      exit: 150
    }, direction, children: /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: positionSX, children }) }),
    type === "zoom" && /* @__PURE__ */ jsxRuntime.jsx(material.Zoom, { ...others, children: /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: positionSX, children }) })
  ] });
});
React.forwardRef(function Transition(props, ref) {
  return /* @__PURE__ */ jsxRuntime.jsx(material.Zoom, { ref, timeout: 200, ...props });
});
module.exports = Transitions;
//# sourceMappingURL=Transitions.cjs.map
