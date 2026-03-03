import { jsx } from "@emotion/react/jsx-runtime";
import Navigation from "./Navigation/index.js";
import SimpleBar from "../../../../third-party/SimpleBar.js";
const DrawerContent = ({
  menuItems = [],
  children
}) => /* @__PURE__ */ jsx(SimpleBar, { sx: {
  "& .simplebar-content": {
    display: "flex",
    flexDirection: "column"
  }
}, children: children ?? /* @__PURE__ */ jsx(Navigation, { menuItems }) });
export {
  DrawerContent as default
};
//# sourceMappingURL=index.js.map
