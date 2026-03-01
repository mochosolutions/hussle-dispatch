"use strict";
const system = require("@mui/system");
function Dialog() {
  return {
    MuiDialog: {
      styleOverrides: {
        root: {
          "& .MuiBackdrop-root": {
            backgroundColor: system.alpha("#000", 0.7)
          }
        }
      }
    }
  };
}
module.exports = Dialog;
//# sourceMappingURL=Dialog.cjs.map
