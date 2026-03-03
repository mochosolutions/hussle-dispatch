"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const react = require("@emotion/react");
const React = require("react");
const material = require("@mui/material");
const index = require("../BaseFieldWrapper/index.cjs");
const TypeaheadField = ({
  name,
  label,
  options,
  formik,
  placeholder,
  disabled = false,
  required = false,
  helperText,
  allowFreeText = false,
  loading = false,
  noOptionsText = "No matches found",
  actionButtonLabel,
  onActionButtonClick,
  onInputValueChange,
  renderOptionContent
}) => {
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const hasError = Boolean(touched && error);
  const currentValue = formik.values[name] ?? "";
  const selectedOption = React.useMemo(() => options.find((option) => option.value === currentValue || option.label === currentValue) ?? null, [currentValue, options]);
  const hasActionButton = Boolean(actionButtonLabel && onActionButtonClick);
  const ActionPaper = (paperProps) => {
    const {
      children,
      ...rest
    } = paperProps;
    return /* @__PURE__ */ jsxRuntime.jsxs(material.Paper, { ...rest, children: [
      children,
      hasActionButton && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(material.Divider, {}),
        /* @__PURE__ */ jsxRuntime.jsx(material.Box, { sx: {
          p: 1
        }, children: /* @__PURE__ */ jsxRuntime.jsx(material.Button, { fullWidth: true, onClick: onActionButtonClick, onMouseDown: (event) => {
          event.preventDefault();
        }, size: "small", variant: "text", children: actionButtonLabel }) })
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxRuntime.jsx(index.BaseFieldWrapper, { name, label, required, error, touched, helperText, children: /* @__PURE__ */ jsxRuntime.jsx(material.Autocomplete, { disabled, freeSolo: allowFreeText, options, value: selectedOption, inputValue: currentValue, loading, noOptionsText, getOptionLabel: (option) => {
    if (typeof option === "string") {
      return option;
    }
    return option.label;
  }, isOptionEqualToValue: (option, value) => option.value === value.value, onInputChange: (_event, value) => {
    formik.setFieldValue(name, value);
    if (onInputValueChange) {
      onInputValueChange(value);
    }
  }, onChange: (_event, value) => {
    if (typeof value === "string") {
      formik.setFieldValue(name, value);
      if (onInputValueChange) {
        onInputValueChange(value);
      }
      return;
    }
    if (value === null) {
      formik.setFieldValue(name, "");
      if (onInputValueChange) {
        onInputValueChange("");
      }
      return;
    }
    formik.setFieldValue(name, value.value);
    if (onInputValueChange) {
      onInputValueChange(value.value);
    }
  }, PaperComponent: ActionPaper, renderOption: (props, option) => /* @__PURE__ */ react.createElement(material.Box, { component: "li", ...props, key: option.value }, renderOptionContent ? renderOptionContent(option) : option.label), renderInput: (params) => /* @__PURE__ */ jsxRuntime.jsx(material.TextField, { ...params, id: name, name, placeholder, fullWidth: true, error: hasError, onBlur: formik.handleBlur, InputProps: {
    ...params.InputProps,
    endAdornment: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      loading ? /* @__PURE__ */ jsxRuntime.jsx(material.CircularProgress, { color: "inherit", size: 18 }) : null,
      params.InputProps.endAdornment
    ] })
  } }) }) });
};
exports.TypeaheadField = TypeaheadField;
//# sourceMappingURL=index.cjs.map
