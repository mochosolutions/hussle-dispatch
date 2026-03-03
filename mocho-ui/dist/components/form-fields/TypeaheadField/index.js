import { jsx, jsxs, Fragment } from "@emotion/react/jsx-runtime";
import { createElement } from "@emotion/react";
import { useMemo } from "react";
import { Autocomplete, TextField, CircularProgress, Box, Paper, Divider, Button } from "@mui/material";
import { BaseFieldWrapper } from "../BaseFieldWrapper/index.js";
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
  const selectedOption = useMemo(() => options.find((option) => option.value === currentValue || option.label === currentValue) ?? null, [currentValue, options]);
  const hasActionButton = Boolean(actionButtonLabel && onActionButtonClick);
  const ActionPaper = (paperProps) => {
    const {
      children,
      ...rest
    } = paperProps;
    return /* @__PURE__ */ jsxs(Paper, { ...rest, children: [
      children,
      hasActionButton && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Divider, {}),
        /* @__PURE__ */ jsx(Box, { sx: {
          p: 1
        }, children: /* @__PURE__ */ jsx(Button, { fullWidth: true, onClick: onActionButtonClick, onMouseDown: (event) => {
          event.preventDefault();
        }, size: "small", variant: "text", children: actionButtonLabel }) })
      ] })
    ] });
  };
  return /* @__PURE__ */ jsx(BaseFieldWrapper, { name, label, required, error, touched, helperText, children: /* @__PURE__ */ jsx(Autocomplete, { disabled, freeSolo: allowFreeText, options, value: selectedOption, inputValue: currentValue, loading, noOptionsText, getOptionLabel: (option) => {
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
  }, PaperComponent: ActionPaper, renderOption: (props, option) => /* @__PURE__ */ createElement(Box, { component: "li", ...props, key: option.value }, renderOptionContent ? renderOptionContent(option) : option.label), renderInput: (params) => /* @__PURE__ */ jsx(TextField, { ...params, id: name, name, placeholder, fullWidth: true, error: hasError, onBlur: formik.handleBlur, InputProps: {
    ...params.InputProps,
    endAdornment: /* @__PURE__ */ jsxs(Fragment, { children: [
      loading ? /* @__PURE__ */ jsx(CircularProgress, { color: "inherit", size: 18 }) : null,
      params.InputProps.endAdornment
    ] })
  } }) }) });
};
export {
  TypeaheadField
};
//# sourceMappingURL=index.js.map
