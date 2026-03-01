"use strict";
function ListItemButton(theme) {
  return {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            color: theme.palette.primary.main,
            "& .MuiListItemIcon-root": {
              color: theme.palette.primary.main
            }
          }
        }
      }
    }
  };
}
module.exports = ListItemButton;
//# sourceMappingURL=ListItemButton.cjs.map
