"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const emotionReactJsxRuntime_browser_esm = require("../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const config = require("../config.cjs");
const useLocalStorage = require("../hooks/useLocalStorage.cjs");
const initialState = {
  ...config.default,
  onChangeContainer: () => {
  },
  onChangeLocalization: (lang) => {
  },
  onChangeMode: (mode) => {
  },
  onChangePresetColor: (theme) => {
  },
  onChangeDirection: (direction) => {
  },
  onChangeMiniDrawer: (miniDrawer) => {
  },
  onChangeMenuOrientation: (menuOrientation) => {
  },
  onChangeFontFamily: (fontFamily) => {
  }
};
const ConfigContext = React.createContext(initialState);
function ConfigProvider({
  children
}) {
  const [config2, setConfig] = useLocalStorage("mantis-react-ts-config", initialState);
  const onChangeContainer = () => {
    setConfig({
      ...config2,
      container: !config2.container
    });
  };
  const onChangeLocalization = (lang) => {
    setConfig({
      ...config2,
      i18n: lang
    });
  };
  const onChangeMode = (mode) => {
    setConfig({
      ...config2,
      mode
    });
  };
  const onChangePresetColor = (theme) => {
    setConfig({
      ...config2,
      presetColor: theme
    });
  };
  const onChangeDirection = (direction) => {
    setConfig({
      ...config2,
      themeDirection: direction
    });
  };
  const onChangeMiniDrawer = (miniDrawer) => {
    setConfig({
      ...config2,
      miniDrawer
    });
  };
  const onChangeMenuOrientation = (layout) => {
    setConfig({
      ...config2,
      menuOrientation: layout
    });
  };
  const onChangeFontFamily = (fontFamily) => {
    setConfig({
      ...config2,
      fontFamily
    });
  };
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ConfigContext.Provider, { value: {
    ...config2,
    onChangeContainer,
    onChangeLocalization,
    onChangeMode,
    onChangePresetColor,
    onChangeDirection,
    onChangeMiniDrawer,
    onChangeMenuOrientation,
    onChangeFontFamily
  }, children });
}
exports.ConfigContext = ConfigContext;
exports.ConfigProvider = ConfigProvider;
//# sourceMappingURL=ConfigContext.cjs.map
