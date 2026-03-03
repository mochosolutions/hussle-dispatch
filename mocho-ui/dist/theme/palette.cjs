"use strict";
const styles = require("@mui/material/styles");
const colors = require("@ant-design/colors");
const index = require("./theme/index.cjs");
const config = require("../types/config.cjs");
const Palette = (mode, presetColor) => {
  const colors$1 = mode === config.ThemeMode.DARK ? colors.presetDarkPalettes : colors.presetPalettes;
  let greyPrimary = ["#ffffff", "#fafafa", "#f5f5f5", "#f0f0f0", "#d9d9d9", "#bfbfbf", "#8c8c8c", "#595959", "#262626", "#141414", "#000000"];
  let greyAscent = ["#fafafa", "#bfbfbf", "#434343", "#1f1f1f"];
  let greyConstant = ["#fafafb", "#e6ebf1"];
  if (mode === config.ThemeMode.DARK) {
    greyPrimary = ["#000000", "#141414", "#1e1e1e", "#595959", "#8c8c8c", "#bfbfbf", "#d9d9d9", "#f0f0f0", "#f5f5f5", "#fafafa", "#ffffff"];
    greyAscent = ["#fafafa", "#bfbfbf", "#434343", "#1f1f1f"];
    greyConstant = ["#121212", "#d3d8db"];
  }
  colors$1.grey = [...greyPrimary, ...greyAscent, ...greyConstant];
  const paletteColor = index(colors$1, presetColor, mode);
  return styles.createTheme({
    palette: {
      mode,
      common: {
        black: "#000",
        white: "#fff"
      },
      ...paletteColor,
      text: {
        primary: mode === config.ThemeMode.DARK ? styles.alpha(paletteColor.grey[900], 0.87) : paletteColor.grey[700],
        secondary: mode === config.ThemeMode.DARK ? styles.alpha(paletteColor.grey[900], 0.45) : paletteColor.grey[500],
        disabled: mode === config.ThemeMode.DARK ? styles.alpha(paletteColor.grey[900], 0.1) : paletteColor.grey[400]
      },
      action: {
        disabled: paletteColor.grey[300]
      },
      divider: mode === config.ThemeMode.DARK ? styles.alpha(paletteColor.grey[900], 0.05) : paletteColor.grey[200],
      background: {
        paper: mode === config.ThemeMode.DARK ? paletteColor.grey[100] : paletteColor.grey[0],
        default: paletteColor.grey.A50
      }
    }
  });
};
module.exports = Palette;
//# sourceMappingURL=palette.cjs.map
