import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { forwardRef } from "react";
import { Box, Grow, Collapse, Fade, Slide, Zoom } from "@mui/material";
const Transitions = forwardRef(({
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
  return /* @__PURE__ */ jsxs(Box, { ref, children: [
    type === "grow" && /* @__PURE__ */ jsx(Grow, { ...others, timeout: {
      appear: 0,
      enter: 150,
      exit: 150
    }, children: /* @__PURE__ */ jsx(Box, { sx: positionSX, children }) }),
    type === "collapse" && /* @__PURE__ */ jsx(Collapse, { ...others, sx: positionSX, children }),
    type === "fade" && /* @__PURE__ */ jsx(Fade, { ...others, timeout: {
      appear: 0,
      enter: 300,
      exit: 150
    }, children: /* @__PURE__ */ jsx(Box, { sx: positionSX, children }) }),
    type === "slide" && /* @__PURE__ */ jsx(Slide, { ...others, timeout: {
      appear: 0,
      enter: 150,
      exit: 150
    }, direction, children: /* @__PURE__ */ jsx(Box, { sx: positionSX, children }) }),
    type === "zoom" && /* @__PURE__ */ jsx(Zoom, { ...others, children: /* @__PURE__ */ jsx(Box, { sx: positionSX, children }) })
  ] });
});
forwardRef(function Transition(props, ref) {
  return /* @__PURE__ */ jsx(Zoom, { ref, timeout: 200, ...props });
});
export {
  Transitions as default
};
//# sourceMappingURL=Transitions.js.map
