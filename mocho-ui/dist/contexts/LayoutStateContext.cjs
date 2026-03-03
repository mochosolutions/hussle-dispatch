"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const styles = require("@mui/material/styles");
const material = require("@mui/material");
const useConfig = require("../hooks/useConfig.cjs");
const LayoutStateContext = React.createContext(null);
const LayoutStateProvider = ({
  children,
  defaultOpen
}) => {
  const theme = styles.useTheme();
  const matchDownXL = material.useMediaQuery(theme.breakpoints.down("xl"));
  const {
    miniDrawer
  } = useConfig();
  const mountRef = React.useRef(false);
  const [drawerOpen, setDrawerOpen] = React.useState(() => {
    if (defaultOpen !== void 0) {
      return defaultOpen;
    }
    if (miniDrawer) {
      return false;
    }
    return false;
  });
  React.useEffect(() => {
    if (!miniDrawer && defaultOpen === void 0) {
      setDrawerOpen(!matchDownXL);
    }
    mountRef.current = true;
  }, []);
  React.useEffect(() => {
    if (mountRef.current && !miniDrawer && defaultOpen === void 0) {
      setDrawerOpen(!matchDownXL);
    }
  }, [matchDownXL]);
  const onDrawerToggle = React.useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);
  const onDrawerClose = React.useCallback(() => {
    setDrawerOpen(false);
  }, []);
  return /* @__PURE__ */ jsxRuntime.jsx(LayoutStateContext.Provider, { value: {
    drawerOpen,
    onDrawerToggle,
    onDrawerClose
  }, children });
};
exports.LayoutStateContext = LayoutStateContext;
exports.LayoutStateProvider = LayoutStateProvider;
//# sourceMappingURL=LayoutStateContext.cjs.map
