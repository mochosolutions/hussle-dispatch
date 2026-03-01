"use strict";
function Tooltip(theme) {
  return {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          color: theme.palette.background.paper
        }
      }
    }
  };
}
module.exports = Tooltip;
//# sourceMappingURL=Tooltip.cjs.map
