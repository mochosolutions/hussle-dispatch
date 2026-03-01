"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const emotionReactJsxRuntime_browser_esm = require("../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const reactRouterDom = require("react-router-dom");
const material = require("@mui/material");
const index = require("./Header/index.cjs");
const index$1 = require("./Footer/index.cjs");
const styled = require("styled-components");
const MainLayoutContainer = styled.div`
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    'sidebar header header'
    'sidebar main main'
    'sidebar footer footer';
  overflow: auto;

  .header {
    grid-area: header;
  }

  .sidebar {
    grid-area: sidebar;
    border: 1px solid black;
  }

  .main {
    grid-area: main;
    display: flex;
  }

  .footer {
    grid-area: footer;
    min-height: 40px;
    padding: 1rem 0;
  }
`;
const ProfileSetupLayout = () => /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(MainLayoutContainer, { children: [
  /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index, {}),
  /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { component: "main", className: "main", sx: {
    width: "100%",
    overflow: "hidden",
    flexGrow: 1,
    p: {
      xs: 2,
      sm: 3
    }
  }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Container, { sx: {
    position: "relative",
    display: "flex",
    flexDirection: "column"
    // justifyContent: "flex-end",
  }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(reactRouterDom.Outlet, {}) }) }),
  /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(index$1, {})
] });
exports.MainLayoutContainer = MainLayoutContainer;
exports.default = ProfileSetupLayout;
//# sourceMappingURL=index.cjs.map
