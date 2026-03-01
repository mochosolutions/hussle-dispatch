"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const config = require("../../config.cjs");
const initialMenuState = {
  drawerOpen: true,
  selectedID: null,
  openItem: [],
  menuItems: []
};
function menuReducer(state, action) {
  switch (action.type) {
    case "OPEN_DRAWER":
      return {
        ...state,
        drawerOpen: action.payload
      };
    case "ACTIVE_ID":
      return {
        ...state,
        selectedID: action.payload
      };
    case "ACTIVE_ITEM":
      return {
        ...state,
        openItem: action.payload
      };
    case "SET_MENU_ITEMS":
      return {
        ...state,
        menuItems: action.payload
      };
    default:
      return state;
  }
}
const LayoutContext = React.createContext(null);
const LayoutProvider = ({
  children,
  initialConfig,
  menuItems = [],
  user,
  onLogout,
  isLoading,
  loadingMessage,
  logo,
  logoIcon,
  initialDrawerOpen = true
}) => {
  const [menu, dispatchMenu] = React.useReducer(menuReducer, {
    ...initialMenuState,
    drawerOpen: initialDrawerOpen,
    menuItems
  });
  const mergedConfig = React.useMemo(() => ({
    ...config.default,
    ...initialConfig
  }), [initialConfig]);
  const [config$1, setConfig] = React.useState(mergedConfig);
  const openDrawer = React.useCallback((open) => {
    dispatchMenu({
      type: "OPEN_DRAWER",
      payload: open
    });
  }, []);
  const activeID = React.useCallback((id) => {
    dispatchMenu({
      type: "ACTIVE_ID",
      payload: id
    });
  }, []);
  const activeItem = React.useCallback((items) => {
    dispatchMenu({
      type: "ACTIVE_ITEM",
      payload: items
    });
  }, []);
  const setMenuItems = React.useCallback((items) => {
    dispatchMenu({
      type: "SET_MENU_ITEMS",
      payload: items
    });
  }, []);
  const onChangeContainer = React.useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      container: !prev.container
    }));
  }, []);
  const onChangeLocalization = React.useCallback((lang) => {
    setConfig((prev) => ({
      ...prev,
      i18n: lang
    }));
  }, []);
  const onChangeMode = React.useCallback((mode) => {
    setConfig((prev) => ({
      ...prev,
      mode
    }));
  }, []);
  const onChangePresetColor = React.useCallback((theme) => {
    setConfig((prev) => ({
      ...prev,
      presetColor: theme
    }));
  }, []);
  const onChangeDirection = React.useCallback((direction) => {
    setConfig((prev) => ({
      ...prev,
      themeDirection: direction
    }));
  }, []);
  const onChangeMiniDrawer = React.useCallback((miniDrawer) => {
    setConfig((prev) => ({
      ...prev,
      miniDrawer
    }));
  }, []);
  const onChangeMenuOrientation = React.useCallback((menuOrientation) => {
    setConfig((prev) => ({
      ...prev,
      menuOrientation
    }));
  }, []);
  const onChangeFontFamily = React.useCallback((fontFamily) => {
    setConfig((prev) => ({
      ...prev,
      fontFamily
    }));
  }, []);
  const customizationProps = React.useMemo(() => ({
    ...config$1,
    onChangeContainer,
    onChangeLocalization,
    onChangeMode,
    onChangePresetColor,
    onChangeDirection,
    onChangeMiniDrawer,
    onChangeMenuOrientation,
    onChangeFontFamily
  }), [config$1, onChangeContainer, onChangeLocalization, onChangeMode, onChangePresetColor, onChangeDirection, onChangeMiniDrawer, onChangeMenuOrientation, onChangeFontFamily]);
  const value = React.useMemo(() => ({
    menu,
    openDrawer,
    activeID,
    activeItem,
    setMenuItems,
    config: customizationProps,
    user,
    onLogout,
    isLoading,
    loadingMessage,
    logo,
    logoIcon
  }), [menu, openDrawer, activeID, activeItem, setMenuItems, customizationProps, user, onLogout, isLoading, loadingMessage, logo, logoIcon]);
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(LayoutContext.Provider, { value, children });
};
function useLayout() {
  const context = React.useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
function useMenu() {
  const {
    menu,
    openDrawer,
    activeID,
    activeItem,
    setMenuItems
  } = useLayout();
  return {
    ...menu,
    openDrawer,
    activeID,
    activeItem,
    setMenuItems
  };
}
function useLayoutConfig() {
  const {
    config: config2
  } = useLayout();
  return config2;
}
exports.LayoutProvider = LayoutProvider;
exports.default = LayoutContext;
exports.useLayout = useLayout;
exports.useLayoutConfig = useLayoutConfig;
exports.useMenu = useMenu;
//# sourceMappingURL=LayoutContext.cjs.map
