import { jsx } from "@emotion/react/jsx-runtime";
import { useRef, useState, useEffect, useCallback, createContext } from "react";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import useConfig from "../hooks/useConfig.js";
const LayoutStateContext = createContext(null);
const LayoutStateProvider = ({
  children,
  defaultOpen
}) => {
  const theme = useTheme();
  const matchDownXL = useMediaQuery(theme.breakpoints.down("xl"));
  const {
    miniDrawer
  } = useConfig();
  const mountRef = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(() => {
    if (defaultOpen !== void 0) {
      return defaultOpen;
    }
    if (miniDrawer) {
      return false;
    }
    return false;
  });
  useEffect(() => {
    if (!miniDrawer && defaultOpen === void 0) {
      setDrawerOpen(!matchDownXL);
    }
    mountRef.current = true;
  }, []);
  useEffect(() => {
    if (mountRef.current && !miniDrawer && defaultOpen === void 0) {
      setDrawerOpen(!matchDownXL);
    }
  }, [matchDownXL]);
  const onDrawerToggle = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);
  const onDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);
  return /* @__PURE__ */ jsx(LayoutStateContext.Provider, { value: {
    drawerOpen,
    onDrawerToggle,
    onDrawerClose
  }, children });
};
export {
  LayoutStateContext,
  LayoutStateProvider
};
//# sourceMappingURL=LayoutStateContext.js.map
