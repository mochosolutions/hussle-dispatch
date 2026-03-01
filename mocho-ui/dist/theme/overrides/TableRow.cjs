"use strict";
function TableRow() {
  return {
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-of-type": {
            "& .MuiTableCell-root": {
              borderBottom: "none"
            }
          },
          "& .MuiTableCell-root": {
            "&:last-of-type": {
              paddingRight: 24
            },
            "&:first-of-type": {
              paddingLeft: 24
            }
          }
        }
      }
    }
  };
}
module.exports = TableRow;
//# sourceMappingURL=TableRow.cjs.map
