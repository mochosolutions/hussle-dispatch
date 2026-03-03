import { jsx } from "@emotion/react/jsx-runtime";
import { Suspense } from "react";
import Loader from "./Loader.js";
const Loadable = (Component) => (props) => /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(Loader, {}), children: /* @__PURE__ */ jsx(Component, { ...props }) });
export {
  Loadable as default
};
//# sourceMappingURL=index.js.map
