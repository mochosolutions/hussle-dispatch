import Default from "./default.js";
import Theme1 from "./theme1.js";
import Theme2 from "./theme2.js";
import Theme4$1 from "./theme3.js";
import Theme4 from "./theme4.js";
import Theme5 from "./theme5.js";
import Theme6 from "./theme6.js";
import Theme7 from "./theme7.js";
import Theme8 from "./theme8.js";
const Theme = (colors, presetColor, mode) => {
  switch (presetColor) {
    case "theme1":
      return Theme1(colors, mode);
    case "theme2":
      return Theme2(colors, mode);
    case "theme3":
      return Theme4$1(colors, mode);
    case "theme4":
      return Theme4(colors, mode);
    case "theme5":
      return Theme5(colors, mode);
    case "theme6":
      return Theme6(colors, mode);
    case "theme7":
      return Theme7(colors, mode);
    case "theme8":
      return Theme8(colors, mode);
    default:
      return Default(colors);
  }
};
export {
  Theme as default
};
//# sourceMappingURL=index.js.map
