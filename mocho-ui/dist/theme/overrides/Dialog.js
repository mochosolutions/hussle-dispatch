import { alpha } from "@mui/system";
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
