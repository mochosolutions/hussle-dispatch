"use strict";
function TableFooter(theme) {
  return {
    MuiTableFooter: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.grey[50],
          borderTop: `2px solid ${theme.palette.divider}`,
          borderBottom: `1px solid ${theme.palette.divider}`
        }
      }
    }
  };
}
module.exports = TableFooter;
//# sourceMappingURL=TableFooter.cjs.map
