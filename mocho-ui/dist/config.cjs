"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const APP_DEFAULT_PATH = "/";
const HORIZONTAL_MAX_ITEM = 7;
const DRAWER_WIDTH = 260;
var ThemeMode = /* @__PURE__ */ ((ThemeMode2) => {
  ThemeMode2["LIGHT"] = "light";
  ThemeMode2["DARK"] = "dark";
  return ThemeMode2;
})(ThemeMode || {});
const config = {
  fontFamily: `'Public Sans', sans-serif`,
  i18n: "en",
  menuOrientation: "vertical",
  miniDrawer: false,
  container: true,
  mode: "light",
  presetColor: "default",
  themeDirection: "ltr"
  /* LTR */
};
exports.APP_DEFAULT_PATH = APP_DEFAULT_PATH;
exports.DRAWER_WIDTH = DRAWER_WIDTH;
exports.HORIZONTAL_MAX_ITEM = HORIZONTAL_MAX_ITEM;
exports.ThemeMode = ThemeMode;
exports.default = config;
//# sourceMappingURL=config.cjs.map
