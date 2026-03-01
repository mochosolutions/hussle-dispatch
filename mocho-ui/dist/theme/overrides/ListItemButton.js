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
export {
  ListItemButton as default
};
//# sourceMappingURL=ListItemButton.js.map
