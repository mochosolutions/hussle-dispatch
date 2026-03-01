"use strict";
const require$$4 = require("@ant-design/colors");
const index = require("./theme/index.cjs");
const config = require("../types/config.cjs");
const createTheme = require("../node_modules/@mui/material/styles/createTheme.cjs");
const system = require("@mui/system");
const Palette = (mode, presetColor) => {
  const colors = mode === config.ThemeMode.DARK ? require$$4.presetDarkPalettes : require$$4.presetPalettes;
  let greyPrimary = ["#ffffff", "#fafafa", "#f5f5f5", "#f0f0f0", "#d9d9d9", "#bfbfbf", "#8c8c8c", "#595959", "#262626", "#141414", "#000000"];
  let greyAscent = ["#fafafa", "#bfbfbf", "#434343", "#1f1f1f"];
  let greyConstant = ["#fafafb", "#e6ebf1"];
  if (mode === config.ThemeMode.DARK) {
    greyPrimary = ["#000000", "#141414", "#1e1e1e", "#595959", "#8c8c8c", "#bfbfbf", "#d9d9d9", "#f0f0f0", "#f5f5f5", "#fafafa", "#ffffff"];
    greyAscent = ["#fafafa", "#bfbfbf", "#434343", "#1f1f1f"];
    greyConstant = ["#121212", "#d3d8db"];
  }
  colors.grey = [...greyPrimary, ...greyAscent, ...greyConstant];
  const paletteColor = index(colors, presetColor, mode);
  return createTheme({
    palette: {
      mode,
      common: {
        black: "#000",
        white: "#fff"
      },
      ...paletteColor,
      text: {
        primary: mode === config.ThemeMode.DARK ? system.alpha(paletteColor.grey[900], 0.87) : paletteColor.grey[700],
        secondary: mode === config.ThemeMode.DARK ? system.alpha(paletteColor.grey[900], 0.45) : paletteColor.grey[500],
        disabled: mode === config.ThemeMode.DARK ? system.alpha(paletteColor.grey[900], 0.1) : paletteColor.grey[400]
      },
      action: {
        disabled: paletteColor.grey[300]
      },
      divider: mode === config.ThemeMode.DARK ? system.alpha(paletteColor.grey[900], 0.05) : paletteColor.grey[200],
      background: {
        paper: mode === config.ThemeMode.DARK ? paletteColor.grey[100] : paletteColor.grey[0],
        default: paletteColor.grey.A50
      }
    }
  });
};
module.exports = Palette;
//# sourceMappingURL=palette.cjs.map
