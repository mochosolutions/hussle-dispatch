"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const jsxRuntime = require("@emotion/react/jsx-runtime");
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
  const content = /* @__PURE__ */ jsxRuntime.jsxs(material.Box, { sx: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    cursor: to ? "pointer" : "default",
    ...sx
  }, children: [
    !textOnly && src && /* @__PURE__ */ jsxRuntime.jsx(material.Box, { component: "img", src, alt, sx: {
      width: isIcon ? 32 : width,
      height: isIcon ? 32 : height,
      objectFit: "contain"
    } }),
    text && !isIcon && /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h5", component: "span", sx: {
      fontWeight: 600,
      color: "text.primary",
      whiteSpace: "nowrap"
    }, children: text }),
    !src && !text && /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h5", component: "span", sx: {
      fontWeight: 600,
      color: "primary.main"
    }, children: isIcon ? "M" : "Logo" })
  ] });
  if (to) {
    return /* @__PURE__ */ jsxRuntime.jsx("a", { href: to, style: {
      textDecoration: "none"
    }, children: content });
  }
  return content;
};
exports.Logo = Logo;
exports.default = Logo;
//# sourceMappingURL=index.cjs.map
