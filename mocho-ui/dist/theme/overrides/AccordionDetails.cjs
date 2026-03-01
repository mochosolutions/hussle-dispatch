"use strict";
function AccordionDetails(theme) {
  return {
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: theme.spacing(2),
          borderTop: `1px solid ${theme.palette.secondary.light}`
        }
      }
    }
  };
}
module.exports = AccordionDetails;
//# sourceMappingURL=AccordionDetails.cjs.map
