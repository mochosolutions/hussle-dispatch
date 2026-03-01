"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const material = require("@mui/material");
const Logo = ({
  src,
  alt = "Logo",
  width = "auto",
  height = 40,
  text,
  textOnly = false,
  to,
  isIcon = false,
  reverse = false,
  sx
}) => {
  const content = /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { sx: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    cursor: to ? "pointer" : "default",
    ...sx
  }, children: [
    !textOnly && src && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { component: "img", src, alt, sx: {
      width: isIcon ? 32 : width,
      height: isIcon ? 32 : height,
      objectFit: "contain"
    } }),
    text && !isIcon && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h5", component: "span", sx: {
      fontWeight: 600,
      color: "text.primary",
      whiteSpace: "nowrap"
    }, children: text }),
    !src && !text && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h5", component: "span", sx: {
      fontWeight: 600,
      color: "primary.main"
    }, children: isIcon ? "M" : "Logo" })
  ] });
  if (to) {
    return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("a", { href: to, style: {
      textDecoration: "none"
    }, children: content });
  }
  return content;
};
exports.Logo = Logo;
exports.default = Logo;
//# sourceMappingURL=index.cjs.map
