import { jsx } from "../../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import Navigation from "./Navigation/index.js";
import SimpleBar from "../../../../third-party/SimpleBar.js";
const DrawerContent = () => /* @__PURE__ */ jsx(SimpleBar, { sx: {
  "& .simplebar-content": {
    display: "flex",
    flexDirection: "column"
  }
}, children: /* @__PURE__ */ jsx(Navigation, {}) });
export {
  DrawerContent as default
};
//# sourceMappingURL=index.js.map
