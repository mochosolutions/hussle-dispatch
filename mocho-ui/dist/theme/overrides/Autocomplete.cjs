"use strict";
function Autocomplete() {
  return {
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            padding: "3px 9px"
          }
        },
        popupIndicator: {
          width: "auto",
          height: "auto"
        },
        clearIndicator: {
          width: "auto",
          height: "auto"
        }
      }
    }
  };
}
module.exports = Autocomplete;
//# sourceMappingURL=Autocomplete.cjs.map
