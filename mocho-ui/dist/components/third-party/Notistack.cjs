"use strict";
const jsxRuntime = require("@emotion/react/jsx-runtime");
const styles = require("@mui/material/styles");
const notistack = require("notistack");
const icons = require("@ant-design/icons");
const StyledSnackbarProvider = styles.styled(notistack.SnackbarProvider)(({
  theme
}) => ({
  "&.notistack-MuiContent-default": {
    backgroundColor: theme.palette.primary.main
  },
  "&.notistack-MuiContent-error": {
    backgroundColor: theme.palette.error.main
  },
  "&.notistack-MuiContent-success": {
    backgroundColor: theme.palette.success.main
  },
  "&.notistack-MuiContent-info": {
    backgroundColor: theme.palette.info.main
  },
  "&.notistack-MuiContent-warning": {
    backgroundColor: theme.palette.warning.main
  }
}));
const Notistack = ({
  children,
  maxSnack = 3,
  dense = false,
  iconVariant
}) => {
  const iconSX = {
    marginRight: 8,
    fontSize: "1.15rem"
  };
  return /* @__PURE__ */ jsxRuntime.jsx(StyledSnackbarProvider, { maxSnack, dense, iconVariant: iconVariant === "useemojis" ? {
    success: /* @__PURE__ */ jsxRuntime.jsx(icons.CheckCircleOutlined, { style: iconSX }),
    error: /* @__PURE__ */ jsxRuntime.jsx(icons.CloseCircleOutlined, { style: iconSX }),
    warning: /* @__PURE__ */ jsxRuntime.jsx(icons.WarningOutlined, { style: iconSX }),
    info: /* @__PURE__ */ jsxRuntime.jsx(icons.InfoCircleOutlined, { style: iconSX })
  } : void 0, hideIconVariant: iconVariant === "hide" ? true : false, children });
};
module.exports = Notistack;
//# sourceMappingURL=Notistack.cjs.map
