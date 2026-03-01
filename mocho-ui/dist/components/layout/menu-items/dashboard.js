import { jsx, Fragment } from "../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { FormattedMessage } from "../../third-party/FormattedMessage.js";
import { HomeOutlined, SettingOutlined, FileTextOutlined, ExperimentOutlined } from "@ant-design/icons";
const icons = {
  dashboard: HomeOutlined,
  settings: SettingOutlined,
  blog: FileTextOutlined,
  components: ExperimentOutlined
};
const DashboardmenuItems = {
  id: "dashboard",
  title: /* @__PURE__ */ jsx(FormattedMessage, { id: "dashboard" }),
  type: "group",
  children: [{
    id: "dashboard-page",
    title: /* @__PURE__ */ jsx(FormattedMessage, { id: "dashboard" }),
    type: "item",
    url: "/",
    icon: icons.dashboard
  }, {
    id: "organizations",
    title: /* @__PURE__ */ jsx(FormattedMessage, { id: "Organizations" }),
    type: "item",
    url: "/organizations",
    icon: icons.settings
  }, {
    id: "blog",
    title: /* @__PURE__ */ jsx(FormattedMessage, { id: "Blog Posts" }),
    type: "collapse",
    url: "/blog",
    icon: icons.blog,
    // type: 'collapse',
    children: [{
      id: "menu-posts",
      title: /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(FormattedMessage, { id: "Posts" }) }),
      type: "item",
      url: "/blog"
    }, {
      id: "menu-author",
      title: /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(FormattedMessage, { id: "Authors" }) }),
      type: "item",
      url: "/authors"
    }, {
      id: "menu-category",
      title: /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(FormattedMessage, { id: "Categories" }) }),
      type: "item",
      url: "/categories"
    }]
  }, {
    id: "components-test",
    title: /* @__PURE__ */ jsx(FormattedMessage, { id: "Components Test" }),
    type: "item",
    url: "/components",
    icon: icons.components
  }]
};
export {
  DashboardmenuItems as default
};
//# sourceMappingURL=dashboard.js.map
