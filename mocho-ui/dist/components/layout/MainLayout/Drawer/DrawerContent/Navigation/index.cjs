"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const NavGroup = require("./NavGroup.cjs");
const useLayoutState = require("../../../../../../hooks/useLayoutState.cjs");
const useConfig = require("../../../../../../hooks/useConfig.cjs");
const config$1 = require("../../../../../../config.cjs");
const config = require("../../../../../../types/config.cjs");
const Navigation = ({
  menuItems
}) => {
  const theme = styles.useTheme();
  const downLG = material.useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig();
  const {
    drawerOpen
  } = useLayoutState();
  const [selectedItems, setSelectedItems] = React.useState("");
  const [selectedLevel, setSelectedLevel] = React.useState(0);
  const [openItem, setOpenItem] = React.useState(["dashboard"]);
  const [selectedID, setSelectedID] = React.useState(null);
  const handleActiveItem = React.useCallback((itemIds) => {
    setOpenItem(itemIds);
  }, []);
  const handleActiveID = React.useCallback((id) => {
    setSelectedID(id);
  }, []);
  const isHorizontal = menuOrientation === config.MenuOrientation.HORIZONTAL && !downLG;
  const lastItem = isHorizontal ? config$1.HORIZONTAL_MAX_ITEM : null;
  let lastItemIndex = menuItems.length - 1;
  let remItems = [];
  let lastItemId = "";
  if (lastItem && lastItem < menuItems.length) {
    lastItemId = menuItems[lastItem - 1].id ?? "";
    lastItemIndex = lastItem - 1;
    remItems = menuItems.slice(lastItem - 1, menuItems.length).map((item) => ({
      title: item.title,
      elements: item.children,
      icon: item.icon
    }));
  }
  const navGroups = menuItems.slice(0, lastItemIndex + 1).map((item) => {
    switch (item.type) {
      case "group":
        return /* @__PURE__ */ jsxRuntime.jsx(NavGroup, { setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, lastItem: lastItem ?? 0, remItems, lastItemId, item, openItem, onActiveItem: handleActiveItem, selectedID, onActiveID: handleActiveID }, item.id);
      default:
        return /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h6", color: "error", align: "center", children: "Fix - Navigation Group" }, item.id);
    }
  });
  return /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: {
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
