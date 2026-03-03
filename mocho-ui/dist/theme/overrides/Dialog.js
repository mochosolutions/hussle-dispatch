import { alpha } from "@mui/material/styles";
function Dialog() {
  return {
    MuiDialog: {
      styleOverrides: {
        root: {
          "& .MuiBackdrop-root": {
            backgroundColor: alpha("#000", 0.7)
          }
        }
      }
    }
  };
}
export {
  Dialog as default
};
//# sourceMappingURL=Dialog.js.map
