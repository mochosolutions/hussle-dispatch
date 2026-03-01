"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const FormattedMessage = require("../../third-party/FormattedMessage.cjs");
const icons$1 = require("@ant-design/icons");
const icons = {
  dashboard: icons$1.HomeOutlined,
  settings: icons$1.SettingOutlined,
  blog: icons$1.FileTextOutlined,
  components: icons$1.ExperimentOutlined
};
const DashboardmenuItems = {
  id: "dashboard",
  title: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FormattedMessage.FormattedMessage, { id: "dashboard" }),
  type: "group",
  children: [{
    id: "dashboard-page",
    title: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FormattedMessage.FormattedMessage, { id: "dashboard" }),
    type: "item",
    url: "/",
    icon: icons.dashboard
  }, {
    id: "organizations",
    title: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FormattedMessage.FormattedMessage, { id: "Organizations" }),
    type: "item",
    url: "/organizations",
    icon: icons.settings
  }, {
    id: "blog",
    title: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FormattedMessage.FormattedMessage, { id: "Blog Posts" }),
    type: "collapse",
    url: "/blog",
    icon: icons.blog,
    // type: 'collapse',
    children: [{
      id: "menu-posts",
      title: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(emotionReactJsxRuntime_browser_esm.Fragment, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FormattedMessage.FormattedMessage, { id: "Posts" }) }),
      type: "item",
      url: "/blog"
    }, {
      id: "menu-author",
      title: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(emotionReactJsxRuntime_browser_esm.Fragment, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FormattedMessage.FormattedMessage, { id: "Authors" }) }),
      type: "item",
      url: "/authors"
    }, {
      id: "menu-category",
      title: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(emotionReactJsxRuntime_browser_esm.Fragment, { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FormattedMessage.FormattedMessage, { id: "Categories" }) }),
      type: "item",
      url: "/categories"
    }]
  }, {
    id: "components-test",
    title: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(FormattedMessage.FormattedMessage, { id: "Components Test" }),
    type: "item",
    url: "/components",
    icon: icons.components
  }]
};
module.exports = DashboardmenuItems;
//# sourceMappingURL=dashboard.cjs.map
