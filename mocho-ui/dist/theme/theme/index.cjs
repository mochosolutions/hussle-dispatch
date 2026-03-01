"use strict";
const _default = require("./default.cjs");
const theme1 = require("./theme1.cjs");
const theme2 = require("./theme2.cjs");
const theme3 = require("./theme3.cjs");
const theme4 = require("./theme4.cjs");
const theme5 = require("./theme5.cjs");
const theme6 = require("./theme6.cjs");
const theme7 = require("./theme7.cjs");
const theme8 = require("./theme8.cjs");
const Theme = (colors, presetColor, mode) => {
  switch (presetColor) {
    case "theme1":
      return theme1(colors, mode);
    case "theme2":
      return theme2(colors, mode);
    case "theme3":
      return theme3(colors, mode);
    case "theme4":
      return theme4(colors, mode);
    case "theme5":
      return theme5(colors, mode);
    case "theme6":
      return theme6(colors, mode);
    case "theme7":
      return theme7(colors, mode);
    case "theme8":
      return theme8(colors, mode);
    default:
      return _default(colors);
  }
};
module.exports = Theme;
//# sourceMappingURL=index.cjs.map
