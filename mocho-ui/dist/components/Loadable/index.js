import { jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { Suspense } from "react";
import Loader from "./Loader.js";
const Loadable = (Component) => (props) => /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(Loader, {}), children: /* @__PURE__ */ jsx(Component, { ...props }) });
export {
  Loadable as default
};
//# sourceMappingURL=index.js.map
