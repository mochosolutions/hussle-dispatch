import { jsx } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import React__default, { useReducer, useMemo, useCallback, createContext, useContext } from "react";
import config from "../../config.js";
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
const LayoutContext = createContext(null);
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
  const [menu, dispatchMenu] = useReducer(menuReducer, {
    ...initialMenuState,
    drawerOpen: initialDrawerOpen,
    menuItems
  });
  const mergedConfig = useMemo(() => ({
    ...config,
    ...initialConfig
  }), [initialConfig]);
  const [config$1, setConfig] = React__default.useState(mergedConfig);
  const openDrawer = useCallback((open) => {
    dispatchMenu({
      type: "OPEN_DRAWER",
      payload: open
    });
  }, []);
  const activeID = useCallback((id) => {
    dispatchMenu({
      type: "ACTIVE_ID",
      payload: id
    });
  }, []);
  const activeItem = useCallback((items) => {
    dispatchMenu({
      type: "ACTIVE_ITEM",
      payload: items
    });
  }, []);
  const setMenuItems = useCallback((items) => {
    dispatchMenu({
      type: "SET_MENU_ITEMS",
      payload: items
    });
  }, []);
  const onChangeContainer = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      container: !prev.container
    }));
  }, []);
  const onChangeLocalization = useCallback((lang) => {
    setConfig((prev) => ({
      ...prev,
      i18n: lang
    }));
  }, []);
  const onChangeMode = useCallback((mode) => {
    setConfig((prev) => ({
      ...prev,
      mode
    }));
  }, []);
  const onChangePresetColor = useCallback((theme) => {
    setConfig((prev) => ({
      ...prev,
      presetColor: theme
    }));
  }, []);
  const onChangeDirection = useCallback((direction) => {
    setConfig((prev) => ({
      ...prev,
      themeDirection: direction
    }));
  }, []);
  const onChangeMiniDrawer = useCallback((miniDrawer) => {
    setConfig((prev) => ({
      ...prev,
      miniDrawer
    }));
  }, []);
  const onChangeMenuOrientation = useCallback((menuOrientation) => {
    setConfig((prev) => ({
      ...prev,
      menuOrientation
    }));
  }, []);
  const onChangeFontFamily = useCallback((fontFamily) => {
    setConfig((prev) => ({
      ...prev,
      fontFamily
    }));
  }, []);
  const customizationProps = useMemo(() => ({
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
  const value = useMemo(() => ({
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
  return /* @__PURE__ */ jsx(LayoutContext.Provider, { value, children });
};
function useLayout() {
  const context = useContext(LayoutContext);
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
export {
  LayoutProvider,
  LayoutContext as default,
  useLayout,
  useLayoutConfig,
  useMenu
};
//# sourceMappingURL=LayoutContext.js.map
