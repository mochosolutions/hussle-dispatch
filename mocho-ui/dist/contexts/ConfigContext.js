import { jsx } from "@emotion/react/jsx-runtime";
import { createContext } from "react";
import config from "../config.js";
import useLocalStorage from "../hooks/useLocalStorage.js";
const initialState = {
  ...config,
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
const ConfigContext = createContext(initialState);
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
  return /* @__PURE__ */ jsx(ConfigContext.Provider, { value: {
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
export {
  ConfigContext,
  ConfigProvider
};
//# sourceMappingURL=ConfigContext.js.map
