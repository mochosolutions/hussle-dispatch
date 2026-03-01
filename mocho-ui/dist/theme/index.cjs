"use strict";
const emotionReactJsxRuntime_browser_esm = require("../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const material = require("@mui/material");
const styled = require("styled-components");
const palette = require("./palette.cjs");
const typography = require("./typography.cjs");
const shadows = require("./shadows.cjs");
const index = require("./overrides/index.cjs");
const config = require("../types/config.cjs");
const createTheme = require("../node_modules/@mui/material/styles/createTheme.cjs");
const ThemeProvider = require("../node_modules/@mui/material/styles/ThemeProvider.cjs");
function ThemeCustomization({
  children,
  mode = config.ThemeMode.LIGHT,
  presetColor = "default",
  themeDirection = config.ThemeDirection.LTR,
  fontFamily = `'Inter', sans-serif`
}) {
  const theme = React.useMemo(() => palette(mode, presetColor), [mode, presetColor]);
  const themeTypography = React.useMemo(
    () => typography(mode, fontFamily),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, fontFamily]
  );
  const themeCustomShadows = React.useMemo(() => shadows(theme), [theme]);
  const themeOptions = React.useMemo(() => ({
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
    components: index(themes)
  });
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.StyledEngineProvider, { injectFirst: true, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(ThemeProvider, { theme: themesWithComponents, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(styled.ThemeProvider, { theme: themesWithComponents, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.CssBaseline, {}),
    children
  ] }) }) });
}
module.exports = ThemeCustomization;
//# sourceMappingURL=index.cjs.map
