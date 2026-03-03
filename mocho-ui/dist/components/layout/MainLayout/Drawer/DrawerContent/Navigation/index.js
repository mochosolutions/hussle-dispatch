import { jsx } from "@emotion/react/jsx-runtime";
import { useState, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery, Typography, Box } from "@mui/material";
import NavGroup from "./NavGroup.js";
import useLayoutState from "../../../../../../hooks/useLayoutState.js";
import useConfig from "../../../../../../hooks/useConfig.js";
import { HORIZONTAL_MAX_ITEM } from "../../../../../../config.js";
import { MenuOrientation } from "../../../../../../types/config.js";
const Navigation = ({
  menuItems
}) => {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig();
  const {
    drawerOpen
  } = useLayoutState();
  const [selectedItems, setSelectedItems] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [openItem, setOpenItem] = useState(["dashboard"]);
  const [selectedID, setSelectedID] = useState(null);
  const handleActiveItem = useCallback((itemIds) => {
    setOpenItem(itemIds);
  }, []);
  const handleActiveID = useCallback((id) => {
    setSelectedID(id);
  }, []);
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;
  const lastItem = isHorizontal ? HORIZONTAL_MAX_ITEM : null;
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
        return /* @__PURE__ */ jsx(NavGroup, { setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, lastItem: lastItem ?? 0, remItems, lastItemId, item, openItem, onActiveItem: handleActiveItem, selectedID, onActiveID: handleActiveID }, item.id);
      default:
        return /* @__PURE__ */ jsx(Typography, { variant: "h6", color: "error", align: "center", children: "Fix - Navigation Group" }, item.id);
    }
  });
  return /* @__PURE__ */ jsx(Box, { sx: {
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
export {
  Navigation as default
};
//# sourceMappingURL=index.js.map
