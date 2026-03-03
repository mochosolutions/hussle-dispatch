"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const jsxRuntime = require("@emotion/react/jsx-runtime");
const react = require("@emotion/react");
const material = require("@mui/material");
const iconsMaterial = require("@mui/icons-material");
const utils = require("./utils.cjs");
const CharCounterField = require("./fields/CharCounterField.cjs");
const SlugField = require("./fields/SlugField.cjs");
function getFormInput({
  field,
  values,
  setFieldValue,
  touched,
  errors,
  handleChange,
  handleBlur
}) {
  const fieldValue = utils.getFieldValue(values, field.name) ?? "";
  const isTouched = utils.getFieldValue(touched, field.name);
  const errorMessage = utils.getFieldValue(errors, field.name);
  const hasError = Boolean(isTouched && errorMessage);
  switch (field.type) {
    case "input": {
      const inputType = field.inputType || "text";
      return /* @__PURE__ */ jsxRuntime.jsx(material.OutlinedInput, { id: field.name, type: inputType, value: fieldValue, name: field.name, onBlur: handleBlur, onChange: handleChange, placeholder: field.placeholder, disabled: field.disabled, fullWidth: true, error: hasError, inputProps: {
        maxLength: field.maxLength,
        minLength: field.minLength
      } });
    }
    case "textarea": {
      return /* @__PURE__ */ jsxRuntime.jsx(material.TextField, { id: field.name, name: field.name, value: fieldValue, onChange: handleChange, onBlur: handleBlur, placeholder: field.placeholder, disabled: field.disabled, multiline: true, rows: field.rows || 4, fullWidth: true, error: hasError, inputProps: {
        maxLength: field.maxLength,
        minLength: field.minLength
      } });
    }
    case "select": {
      return /* @__PURE__ */ jsxRuntime.jsx(material.Select, { id: field.name, name: field.name, value: fieldValue, onChange: (e) => setFieldValue(field.name, e.target.value), disabled: field.disabled, multiple: field.multiple, fullWidth: true, error: hasError, children: field.options.map((option) => /* @__PURE__ */ jsxRuntime.jsx(material.MenuItem, { value: option.value, children: option.label }, option.value)) });
    }
    case "slug": {
      return /* @__PURE__ */ jsxRuntime.jsx(SlugField.SlugField, { field, values, touched, errors, handleChange, handleBlur, setFieldValue });
    }
    case "charCounter": {
      return /* @__PURE__ */ jsxRuntime.jsx(CharCounterField.CharCounterField, { field, values, touched, errors, handleChange, handleBlur });
    }
    case "autocomplete":
    case "fileUpload":
    case "custom":
      return /* @__PURE__ */ jsxRuntime.jsxs(material.FormHelperText, { error: true, children: [
        'Field type "',
        field.type,
        '" not yet implemented'
      ] });
    default: {
      const _exhaustiveCheck = field;
      return _exhaustiveCheck;
    }
  }
}
function DynamicForm({
  structure,
  values,
  touched,
  errors,
  handleChange,
  handleBlur,
  setFieldValue
}) {
  const renderField = (field) => {
    const {
      name,
      label
    } = field;
    const fieldError = utils.getFieldValue(touched, name) && utils.getFieldValue(errors, name);
    const gridProps = utils.getGridBreakpoints(field.grid);
    return /* @__PURE__ */ react.createElement(material.Grid, { item: true, ...gridProps, key: name }, /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 1, children: [
      /* @__PURE__ */ jsxRuntime.jsx(material.InputLabel, { htmlFor: name, required: field.required, children: label }),
      getFormInput({
        field,
        values,
        setFieldValue,
        touched,
        errors,
        handleChange,
        handleBlur
      }),
      fieldError && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { error: true, children: String(fieldError) }),
      field.helperText && !fieldError && /* @__PURE__ */ jsxRuntime.jsx(material.FormHelperText, { children: field.helperText })
    ] }));
  };
  const renderSection = (section, index) => {
    const content = /* @__PURE__ */ jsxRuntime.jsx(material.Grid, { container: true, spacing: 2, children: section.fields.map(renderField) });
    if (section.collapsible) {
      return /* @__PURE__ */ jsxRuntime.jsxs(material.Accordion, { defaultExpanded: section.defaultExpanded !== false, children: [
        /* @__PURE__ */ jsxRuntime.jsx(material.AccordionSummary, { expandIcon: /* @__PURE__ */ jsxRuntime.jsx(iconsMaterial.ExpandMore, {}), children: /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h6", children: section.title }) }),
        /* @__PURE__ */ jsxRuntime.jsx(material.AccordionDetails, { children: content })
      ] }, index);
    }
    return /* @__PURE__ */ jsxRuntime.jsxs(material.Stack, { spacing: 2, children: [
      /* @__PURE__ */ jsxRuntime.jsx(material.Typography, { variant: "h6", children: section.title }),
      content
    ] }, index);
  };
  if (structure.sections) {
    return /* @__PURE__ */ jsxRuntime.jsx(material.Stack, { spacing: 3, children: structure.sections.map(renderSection) });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(material.Grid, { container: true, spacing: 2, children: structure.fields?.map(renderField) });
}
exports.default = DynamicForm;
exports.getFormInput = getFormInput;
//# sourceMappingURL=index.cjs.map
