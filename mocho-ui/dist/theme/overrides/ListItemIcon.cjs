"use strict";
function ListItemIcon(theme) {
  return {
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 24,
          color: theme.palette.text.primary
        }
      }
    }
  };
}
module.exports = ListItemIcon;
//# sourceMappingURL=ListItemIcon.cjs.map
