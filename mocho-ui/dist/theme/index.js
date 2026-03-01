import { jsx, jsxs } from "../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { useMemo } from "react";
import { CssBaseline, StyledEngineProvider } from "@mui/material";
import { ThemeProvider as ThemeProvider$1 } from "styled-components";
import Palette from "./palette.js";
import Typography from "./typography.js";
import CustomShadows from "./shadows.js";
import ComponentsOverrides from "./overrides/index.js";
import { ThemeMode, ThemeDirection } from "../types/config.js";
import createTheme from "../node_modules/@mui/material/styles/createTheme.js";
import ThemeProvider from "../node_modules/@mui/material/styles/ThemeProvider.js";
function ThemeCustomization({
  children,
  mode = ThemeMode.LIGHT,
  presetColor = "default",
  themeDirection = ThemeDirection.LTR,
  fontFamily = `'Inter', sans-serif`
}) {
  const theme = useMemo(() => Palette(mode, presetColor), [mode, presetColor]);
  const themeTypography = useMemo(
    () => Typography(mode, fontFamily),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, fontFamily]
  );
  const themeCustomShadows = useMemo(() => CustomShadows(theme), [theme]);
  const themeOptions = useMemo(() => ({
    breakpoints: {
      values: {
        xs: 0,
        sm: 768,
        md: 1024,
        lg: 1266,
        xl: 1440
      }
    },
    direction: themeDirection,
    mixins: {
      toolbar: {
        minHeight: 60,
        paddingTop: 8,
        paddingBottom: 8
      }
    },
    palette: theme.palette,
    customShadows: themeCustomShadows,
    typography: themeTypography
  }), [themeDirection, theme, themeTypography, themeCustomShadows]);
  const themes = createTheme(themeOptions);
  const themesWithComponents = createTheme({
    ...themes,
    components: ComponentsOverrides(themes)
  });
  return /* @__PURE__ */ jsx(StyledEngineProvider, { injectFirst: true, children: /* @__PURE__ */ jsx(ThemeProvider, { theme: themesWithComponents, children: /* @__PURE__ */ jsxs(ThemeProvider$1, { theme: themesWithComponents, children: [
    /* @__PURE__ */ jsx(CssBaseline, {}),
    children
  ] }) }) });
}
export {
  ThemeCustomization as default
};
//# sourceMappingURL=index.js.map
