import { jsx } from "../../../../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { useState, useLayoutEffect } from "react";
import { useMediaQuery, Typography, Box } from "@mui/material";
import NavGroup from "./NavGroup.js";
import { useSelector } from "../../../../../../store/index.js";
import { useConfig } from "../../../../../../hooks/useConfig.js";
import { HORIZONTAL_MAX_ITEM } from "../../../../../../config.js";
import { MenuOrientation } from "../../../../../../types/config.js";
import menuItems from "../../../../menu-items/index.js";
import useTheme from "../../../../../../node_modules/@mui/material/styles/useTheme.js";
const Navigation = () => {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    menuOrientation
  } = useConfig();
  const {
    drawerOpen
  } = useSelector((state) => state.menu);
  const [selectedItems, setSelectedItems] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [menuItems$1, setMenuItems] = useState({
    items: []
  });
  useLayoutEffect(() => {
    setMenuItems(menuItems);
  }, [menuItems]);
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;
  const lastItem = isHorizontal ? HORIZONTAL_MAX_ITEM : null;
  let lastItemIndex = menuItems$1.items.length - 1;
  let remItems = [];
  let lastItemId;
  if (lastItem && lastItem < menuItems$1.items.length) {
    lastItemId = menuItems$1.items[lastItem - 1].id;
    lastItemIndex = lastItem - 1;
    remItems = menuItems$1.items.slice(lastItem - 1, menuItems$1.items.length).map((item) => ({
      title: item.title,
      elements: item.children,
      icon: item.icon
    }));
  }
  const navGroups = menuItems$1.items.slice(0, lastItemIndex + 1).map((item) => {
    switch (item.type) {
      case "group":
        return /* @__PURE__ */ jsx(NavGroup, { setSelectedItems, setSelectedLevel, selectedLevel, selectedItems, lastItem, remItems, lastItemId, item }, item.id);
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
