import {ReactNode, useMemo} from 'react';

// material-ui
import {CssBaseline, StyledEngineProvider} from '@mui/material';
import {
  createTheme,
  ThemeOptions,
  ThemeProvider as StylesProvider,
  Theme,
  TypographyVariantsOptions,
} from '@mui/material/styles';
import {ThemeProvider} from 'styled-components';
// project import
import Palette from './palette';
import Typography from './typography';
import CustomShadows from './shadows';
import componentsOverride from './overrides';

// types
import {CustomShadowProps} from '../types/theme';
import {ThemeMode, ThemeDirection, PresetColor, FontFamily} from '../types/config';

// types
type ThemeCustomizationProps = {
  children: ReactNode;
  mode?: ThemeMode;
  presetColor?: PresetColor;
  themeDirection?: ThemeDirection;
  fontFamily?: FontFamily;
};

// ==============================|| DEFAULT THEME - MAIN  ||============================== //

export default function ThemeCustomization({
  children,
  mode = ThemeMode.LIGHT,
  presetColor = 'default',
  themeDirection = ThemeDirection.LTR,
  fontFamily = `'Inter', sans-serif`,
}: ThemeCustomizationProps) {

  const theme: Theme = useMemo<Theme>(
    () => Palette(mode, presetColor),
    [mode, presetColor],
  );

  const themeTypography: TypographyVariantsOptions =
    useMemo<TypographyVariantsOptions>(
      () => Typography(mode, fontFamily, theme),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [mode, fontFamily],
    );
  const themeCustomShadows: CustomShadowProps = useMemo<CustomShadowProps>(
    () => CustomShadows(theme),
    [theme],
  );

  const themeOptions: ThemeOptions = useMemo(
    () => ({
      breakpoints: {
        values: {
          xs: 0,
          sm: 768,
          md: 1024,
          lg: 1266,
          xl: 1440,
        },
      },
      direction: themeDirection,
      mixins: {
        toolbar: {
          minHeight: 60,
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
      palette: theme.palette,
      customShadows: themeCustomShadows,
      typography: themeTypography,
    }),
    [themeDirection, theme, themeTypography, themeCustomShadows],
  );

  const themes: Theme = createTheme(themeOptions);
  const themesWithComponents: Theme = createTheme({
    ...themes,
    components: componentsOverride(themes),
  });

  return (
    <StyledEngineProvider injectFirst>
      <StylesProvider theme={themesWithComponents}>
        <ThemeProvider theme={themesWithComponents}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StylesProvider>
    </StyledEngineProvider>
  );
}
