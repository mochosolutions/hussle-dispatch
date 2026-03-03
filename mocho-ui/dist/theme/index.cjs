"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const React = require("react");
const material = require("@mui/material");
const styles = require("@mui/material/styles");
const styled = require("styled-components");
const palette = require("./palette.cjs");
const typography = require("./typography.cjs");
const shadows = require("./shadows.cjs");
const index = require("./overrides/index.cjs");
const config = require("../types/config.cjs");
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
  const themes = styles.createTheme(themeOptions);
  const themesWithComponents = styles.createTheme({
    ...themes,
    components: index(themes)
  });
  return /* @__PURE__ */ jsxRuntime.jsx(material.StyledEngineProvider, { injectFirst: true, children: /* @__PURE__ */ jsxRuntime.jsx(styles.ThemeProvider, { theme: themesWithComponents, children: /* @__PURE__ */ jsxRuntime.jsxs(styled.ThemeProvider, { theme: themesWithComponents, children: [
    /* @__PURE__ */ jsxRuntime.jsx(material.CssBaseline, {}),
    children
  ] }) }) });
}
module.exports = ThemeCustomization;
//# sourceMappingURL=index.cjs.map
