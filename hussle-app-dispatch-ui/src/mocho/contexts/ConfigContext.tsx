import {createContext, ReactNode} from 'react';

// project import
import config from '../config';
import useLocalStorage from '../hooks/useLocalStorage';

// types
import {
  CustomizationProps,
  FontFamily,
  I18n,
  MenuOrientation,
  PresetColor,
  ThemeDirection,
  ThemeMode,
} from '../types/config';

// initial state
const initialState: CustomizationProps = {
  ...config,
  onChangeContainer: () => { return; },
  onChangeLocalization: (_lang: I18n) => { return; },
  onChangeMode: (_mode: ThemeMode) => { return; },
  onChangePresetColor: (_theme: PresetColor) => { return; },
  onChangeDirection: (_direction: ThemeDirection) => { return; },
  onChangeMiniDrawer: (_miniDrawer: boolean) => { return; },
  onChangeMenuOrientation: (_menuOrientation: MenuOrientation) => { return; },
  onChangeFontFamily: (_fontFamily: FontFamily) => { return; },
};

// ==============================|| CONFIG CONTEXT & PROVIDER ||============================== //

const ConfigContext = createContext(initialState);

type ConfigProviderProps = {
  children: ReactNode;
};

function ConfigProvider({children}: ConfigProviderProps) {
  const [config, setConfig] = useLocalStorage(
    'mantis-react-ts-config',
    initialState,
  );

  const onChangeContainer = () => {
    setConfig({
      ...config,
      container: !config.container,
    });
  };

  const onChangeLocalization = (lang: I18n) => {
    setConfig({
      ...config,
      i18n: lang,
    });
  };

  const onChangeMode = (mode: ThemeMode) => {
    setConfig({
      ...config,
      mode,
    });
  };

  const onChangePresetColor = (theme: PresetColor) => {
    setConfig({
      ...config,
      presetColor: theme,
    });
  };

  const onChangeDirection = (direction: ThemeDirection) => {
    setConfig({
      ...config,
      themeDirection: direction,
    });
  };

  const onChangeMiniDrawer = (miniDrawer: boolean) => {
    setConfig({
      ...config,
      miniDrawer,
    });
  };

  const onChangeMenuOrientation = (layout: MenuOrientation) => {
    setConfig({
      ...config,
      menuOrientation: layout,
    });
  };

  const onChangeFontFamily = (fontFamily: FontFamily) => {
    setConfig({
      ...config,
      fontFamily,
    });
  };

  return (
    <ConfigContext.Provider
      value={{
        ...config,
        onChangeContainer,
        onChangeLocalization,
        onChangeMode,
        onChangePresetColor,
        onChangeDirection,
        onChangeMiniDrawer,
        onChangeMenuOrientation,
        onChangeFontFamily,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export {ConfigProvider, ConfigContext};
