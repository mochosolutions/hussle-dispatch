import { jsxs, Fragment, jsx } from "@emotion/react/jsx-runtime";
import { Suspense, lazy } from "react";
import { Outlet } from "react-router-dom";
import Loader from "../../Loadable/Loader.js";
const Header = lazy(() => import("./Header.js"));
const FooterBlock = lazy(() => import("./FooterBlock.js"));
const CommonLayout = ({
  layout = "blank"
}) => /* @__PURE__ */ jsxs(Fragment, { children: [
  (layout === "landing" || layout === "simple") && /* @__PURE__ */ jsxs(Suspense, { fallback: /* @__PURE__ */ jsx(Loader, {}), children: [
    /* @__PURE__ */ jsx(Header, { layout }),
    /* @__PURE__ */ jsx(Outlet, {}),
    /* @__PURE__ */ jsx(FooterBlock, { isFull: layout === "landing" })
  ] }),
  layout === "blank" && /* @__PURE__ */ jsx(Outlet, {})
] });
export {
  CommonLayout as default
};
//# sourceMappingURL=index.js.map
