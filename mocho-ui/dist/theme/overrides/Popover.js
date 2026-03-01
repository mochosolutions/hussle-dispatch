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
export {
  Popover as default
};
//# sourceMappingURL=Popover.js.map
