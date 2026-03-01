"use strict";
const emotionReactJsxRuntime_browser_esm = require("../../../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const material = require("@mui/material");
const NavGroup = require("./NavGroup.cjs");
const index = require("../../../../../../store/index.cjs");
const useConfig = require("../../../../../../hooks/useConfig.cjs");
const config$1 = require("../../../../../../config.cjs");
const config = require("../../../../../../types/config.cjs");
const index$1 = require("../../../../menu-items/index.cjs");
const useTheme = require("../../../../../../node_modules/@mui/material/styles/useTheme.cjs");
const Navigation = () => {
  const theme = useTheme();
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig.useConfig();
  const {
    drawerOpen
  } = index.useSelector((state) => state.menu);
  const [selectedItems, setSelectedItems] = React.useState("");
  const [selectedLevel, setSelectedLevel] = React.useState(0);
  const [menuItems, setMenuItems] = React.useState({
    items: []
  });
  React.useLayoutEffect(() => {
    setMenuItems(index$1);
  }, [index$1]);
  const isHorizontal = menuOrientation === config.MenuOrientation.HORIZONTAL && !downLG;
  const lastItem = isHorizontal ? config$1.HORIZONTAL_MAX_ITEM : null;
  let lastItemIndex = menuItems.items.length - 1;
  let remItems = [];
  let lastItemId;
  if (lastItem && lastItem < menuItems.items.length) {
    lastItemId = menuItems.items[lastItem - 1].id;
    lastItemIndex = lastItem - 1;
    remItems = menuItems.items.slice(lastItem - 1, menuItems.items.length).map((item) => ({
      title: item.title,
      elements: item.children,
      icon: item.icon
    }));
  }
  const navGroups = menuItems.items.slice(0, lastItemIndex + 1).map((item) => {
    switch (item.type) {
      case "group":
        return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(NavGroup, { setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, lastItem, remItems, lastItemId, item }, item.id);
      default:
        return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Typography, { variant: "h6", color: "error", align: "center", children: "Fix - Navigation Group" }, item.id);
    }
  });
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { sx: {
    pt: drawerOpen ? isHorizontal ? 0 : 2 : 0,
    "& > ul:first-of-type": {
      mt: 0
    },
    display: isHorizontal ? {
      xs: "block",
      lg: "flex"
    } : "block"
  }, children: navGroups });
};
module.exports = Navigation;
//# sourceMappingURL=index.cjs.map
