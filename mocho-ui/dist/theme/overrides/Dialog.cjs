"use strict";
const styles = require("@mui/material/styles");
function Dialog() {
  return {
    MuiDialog: {
      styleOverrides: {
        root: {
          "& .MuiBackdrop-root": {
            backgroundColor: styles.alpha("#000", 0.7)
          }
        }
      }
    }
  };
}
module.exports = Dialog;
//# sourceMappingURL=Dialog.cjs.map
