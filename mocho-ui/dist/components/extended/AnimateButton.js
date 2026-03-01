import { jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { useCycle, motion } from "framer-motion";
function AnimateButton({
  children,
  type = "scale",
  direction = "right",
  offset = 10,
  scale = {
    hover: 1.05,
    tap: 0.954
  }
}) {
  let offset1;
  let offset2;
  switch (direction) {
    case "up":
    case "left":
      offset1 = offset;
      offset2 = 0;
      break;
    case "right":
    case "down":
    default:
      offset1 = 0;
      offset2 = offset;
      break;
  }
  const [x, cycleX] = useCycle(offset1, offset2);
  const [y, cycleY] = useCycle(offset1, offset2);
  switch (type) {
    case "rotate":
      return /* @__PURE__ */ jsx(motion.div, { animate: {
        rotate: 360
      }, transition: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 2,
        repeatDelay: 0
      }, children });
    case "slide":
      if (direction === "up" || direction === "down") {
        return /* @__PURE__ */ jsx(motion.div, { animate: {
          y: y !== void 0 ? y : ""
        }, onHoverEnd: () => cycleY(), onHoverStart: () => cycleY(), children });
      }
      return /* @__PURE__ */ jsx(motion.div, { animate: {
        x: x !== void 0 ? x : ""
      }, onHoverEnd: () => cycleX(), onHoverStart: () => cycleX(), children });
    case "scale":
    default:
      if (typeof scale === "number") {
        scale = {
          hover: scale,
          tap: scale
        };
      }
      return /* @__PURE__ */ jsx(motion.div, { whileHover: {
        scale: scale?.hover
      }, whileTap: {
        scale: scale?.tap
      }, children });
  }
}
export {
  AnimateButton as default
};
//# sourceMappingURL=AnimateButton.js.map
