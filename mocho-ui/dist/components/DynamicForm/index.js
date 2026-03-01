import { jsx, jsxs } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { createElement } from "@emotion/react";
import { Stack, Grid, Typography, AccordionSummary, AccordionDetails, Accordion, InputLabel, FormHelperText, MenuItem, Select, TextField, OutlinedInput } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { getFieldValue, getGridBreakpoints } from "./utils.js";
import { CharCounterField } from "./fields/CharCounterField.js";
import { SlugField } from "./fields/SlugField.js";
function getFormInput({
  field,
  values,
  setFieldValue,
  touched,
  errors,
  handleChange,
  handleBlur
}) {
  const fieldValue = getFieldValue(values, field.name) ?? "";
  const isTouched = getFieldValue(touched, field.name);
  const errorMessage = getFieldValue(errors, field.name);
  const hasError = Boolean(isTouched && errorMessage);
  switch (field.type) {
    case "input": {
      const inputType = field.inputType || "text";
      return /* @__PURE__ */ jsx(OutlinedInput, { id: field.name, type: inputType, value: fieldValue, name: field.name, onBlur: handleBlur, onChange: handleChange, placeholder: field.placeholder, disabled: field.disabled, fullWidth: true, error: hasError, inputProps: {
        maxLength: field.maxLength,
        minLength: field.minLength
      } });
    }
    case "textarea": {
      return /* @__PURE__ */ jsx(TextField, { id: field.name, name: field.name, value: fieldValue, onChange: handleChange, onBlur: handleBlur, placeholder: field.placeholder, disabled: field.disabled, multiline: true, rows: field.rows || 4, fullWidth: true, error: hasError, inputProps: {
        maxLength: field.maxLength,
        minLength: field.minLength
      } });
    }
    case "select": {
      return /* @__PURE__ */ jsx(Select, { id: field.name, name: field.name, value: fieldValue, onChange: (e) => setFieldValue(field.name, e.target.value), disabled: field.disabled, multiple: field.multiple, fullWidth: true, error: hasError, children: field.options.map((option) => /* @__PURE__ */ jsx(MenuItem, { value: option.value, children: option.label }, option.value)) });
    }
    case "slug": {
      return /* @__PURE__ */ jsx(SlugField, { field, values, touched, errors, handleChange, handleBlur, setFieldValue });
    }
    case "charCounter": {
      return /* @__PURE__ */ jsx(CharCounterField, { field, values, touched, errors, handleChange, handleBlur });
    }
    case "autocomplete":
    case "fileUpload":
    case "custom":
      return /* @__PURE__ */ jsxs(FormHelperText, { error: true, children: [
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
    const fieldError = getFieldValue(touched, name) && getFieldValue(errors, name);
    const gridProps = getGridBreakpoints(field.grid);
    return /* @__PURE__ */ createElement(Grid, { item: true, ...gridProps, key: name }, /* @__PURE__ */ jsxs(Stack, { spacing: 1, children: [
      /* @__PURE__ */ jsx(InputLabel, { htmlFor: name, required: field.required, children: label }),
      getFormInput({
        field,
        values,
        setFieldValue,
        touched,
        errors,
        handleChange,
        handleBlur
      }),
      fieldError && /* @__PURE__ */ jsx(FormHelperText, { error: true, children: String(fieldError) }),
      field.helperText && !fieldError && /* @__PURE__ */ jsx(FormHelperText, { children: field.helperText })
    ] }));
  };
  const renderSection = (section, index) => {
    const content = /* @__PURE__ */ jsx(Grid, { container: true, spacing: 2, children: section.fields.map(renderField) });
    if (section.collapsible) {
      return /* @__PURE__ */ jsxs(Accordion, { defaultExpanded: section.defaultExpanded !== false, children: [
        /* @__PURE__ */ jsx(AccordionSummary, { expandIcon: /* @__PURE__ */ jsx(ExpandMore, {}), children: /* @__PURE__ */ jsx(Typography, { variant: "h6", children: section.title }) }),
        /* @__PURE__ */ jsx(AccordionDetails, { children: content })
      ] }, index);
    }
    return /* @__PURE__ */ jsxs(Stack, { spacing: 2, children: [
      /* @__PURE__ */ jsx(Typography, { variant: "h6", children: section.title }),
      content
    ] }, index);
  };
  if (structure.sections) {
    return /* @__PURE__ */ jsx(Stack, { spacing: 3, children: structure.sections.map(renderSection) });
  }
  return /* @__PURE__ */ jsx(Grid, { container: true, spacing: 2, children: structure.fields?.map(renderField) });
}
export {
  DynamicForm as default,
  getFormInput
};
//# sourceMappingURL=index.js.map
