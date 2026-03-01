"use strict";
function Popover(theme) {
  return {
    MuiPopover: {
      styleOverrides: {
        paper: {
          boxShadow: theme.customShadows?.z1
        }
      }
    }
  };
}
module.exports = Popover;
//# sourceMappingURL=Popover.cjs.map
