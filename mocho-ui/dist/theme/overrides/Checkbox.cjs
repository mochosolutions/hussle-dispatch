"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const material = require("@mui/material");
const getColors = require("../../utils/getColors.cjs");
const icons = require("@ant-design/icons");
function getColorStyle({
  color,
  theme
}) {
  const colors = getColors(theme, color);
  const {
    lighter,
    main,
    dark
  } = colors;
  return {
    "&:hover": {
      backgroundColor: lighter,
      "& .icon": {
        borderColor: main
      }
    },
    "&.Mui-focusVisible": {
      outline: `2px solid ${dark}`,
      outlineOffset: -4
    }
  };
}
function getSizeStyle(size) {
  switch (size) {
    case "small":
      return {
        size: 16,
        fontSize: 1,
        position: 1
      };
    case "large":
      return {
        size: 24,
        fontSize: 1.6,
        position: 2
      };
    case "medium":
    default:
      return {
        size: 20,
        fontSize: 1.35,
        position: 2
      };
  }
}
function checkboxStyle(size) {
  const sizes = getSizeStyle(size);
  return {
    "& .icon": {
      width: sizes.size,
      height: sizes.size,
      "& .filled": {
        fontSize: `${sizes.fontSize}rem`,
        top: -sizes.position,
        left: -sizes.position
      }
    }
  };
}
function Checkbox(theme) {
  const {
    palette
  } = theme;
  return {
    MuiCheckbox: {
      defaultProps: {
        className: "size-small",
        icon: /* @__PURE__ */ jsxRuntime.jsx(material.Box, { className: "icon", sx: {
          width: 16,
          height: 16,
          border: "1px solid",
          borderColor: "inherit",
          borderRadius: 0.25
        } }),
        checkedIcon: /* @__PURE__ */ jsxRuntime.jsx(material.Box, { className: "icon", sx: {
          width: 16,
          height: 16,
          border: "1px solid",
          borderColor: "inherit",
          borderRadius: 0.25,
          position: "relative"
        }, children: /* @__PURE__ */ jsxRuntime.jsx(icons.CheckSquareFilled, { className: "filled", style: {
          position: "absolute"
        } }) }),
        indeterminateIcon: /* @__PURE__ */ jsxRuntime.jsx(material.Box, { className: "icon", sx: {
          width: 16,
          height: 16,
          border: "1px solid",
          borderColor: "inherit",
          borderRadius: 0.25,
          position: "relative"
        }, children: /* @__PURE__ */ jsxRuntime.jsx(icons.MinusSquareFilled, { className: "filled", style: {
          position: "absolute"
        } }) })
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          color: palette.secondary[300],
          "&.size-small": {
            ...checkboxStyle("small")
          },
          "&.size-medium": {
            ...checkboxStyle("medium")
          },
          "&.size-large": {
            ...checkboxStyle("large")
          }
        },
        colorPrimary: getColorStyle({
          color: "primary",
          theme
        }),
        colorSecondary: getColorStyle({
          color: "secondary",
          theme
        }),
        colorSuccess: getColorStyle({
          color: "success",
          theme
        }),
        colorWarning: getColorStyle({
          color: "warning",
          theme
        }),
        colorInfo: getColorStyle({
          color: "info",
          theme
        }),
        colorError: getColorStyle({
          color: "error",
          theme
        })
      }
    }
  };
}
module.exports = Checkbox;
//# sourceMappingURL=Checkbox.cjs.map
