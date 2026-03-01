function TableHead(theme) {
  return {
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.grey[50],
          borderTop: `1px solid ${theme.palette.divider}`,
          borderBottom: `2px solid ${theme.palette.divider}`
        }
      }
    }
  };
}
export {
  TableHead as default
};
//# sourceMappingURL=TableHead.js.map
