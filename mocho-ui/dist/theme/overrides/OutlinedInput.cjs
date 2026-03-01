"use strict";
const getColors = require("../../utils/getColors.cjs");
const getShadow = require("../../utils/getShadow.cjs");
const config = require("../../types/config.cjs");
function getColor({
  variant,
  theme
}) {
  const colors = getColors(theme, variant);
  const {
    light
  } = colors;
  const shadows = getShadow(theme, `${variant}`);
  return {
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: light
    },
    "&.Mui-focused": {
      boxShadow: shadows,
      "& .MuiOutlinedInput-notchedOutline": {
        border: `1px solid ${light}`
      }
    }
  };
}
function OutlinedInput(theme) {
  return {
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          padding: "10.5px 14px 10.5px 12px"
        },
        notchedOutline: {
          borderColor: theme.palette.mode === config.ThemeMode.DARK ? theme.palette.grey[200] : theme.palette.grey[300]
        },
        root: {
          ...getColor({
            variant: "primary",
            theme
          }),
          "&.Mui-error": {
            ...getColor({
              variant: "error",
              theme
            })
          }
        },
        inputSizeSmall: {
          padding: "7.5px 8px 7.5px 12px"
        },
        inputMultiline: {
          padding: 0
        },
        colorSecondary: getColor({
          variant: "secondary",
          theme
        }),
        colorError: getColor({
          variant: "error",
          theme
        }),
        colorWarning: getColor({
          variant: "warning",
          theme
        }),
        colorInfo: getColor({
          variant: "info",
          theme
        }),
        colorSuccess: getColor({
          variant: "success",
          theme
        })
      }
    }
  };
}
module.exports = OutlinedInput;
//# sourceMappingURL=OutlinedInput.cjs.map
