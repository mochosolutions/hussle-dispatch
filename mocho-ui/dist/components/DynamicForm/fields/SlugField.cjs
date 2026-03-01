"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const emotionReactJsxRuntime_browser_esm = require("../../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const material = require("@mui/material");
const utils = require("../utils.cjs");
function SlugField({
  field,
  values,
  touched,
  errors,
  handleChange,
  handleBlur,
  setFieldValue
}) {
  const fieldValue = utils.getFieldValue(values, field.name) ?? "";
  const isTouched = utils.getFieldValue(touched, field.name);
  const errorMessage = utils.getFieldValue(errors, field.name);
  const hasError = Boolean(isTouched && errorMessage);
  React.useEffect(() => {
    const sourceValue = utils.getFieldValue(values, field.sourceField);
    if (sourceValue && !isTouched) {
      const generatedSlug = field.generator(sourceValue);
      setFieldValue(field.name, generatedSlug);
    }
  }, [utils.getFieldValue(values, field.sourceField), isTouched, field.generator, field.name, setFieldValue]);
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.OutlinedInput, { id: field.name, name: field.name, value: fieldValue, onChange: handleChange, onBlur: handleBlur, placeholder: field.placeholder, disabled: field.disabled, fullWidth: true, error: hasError });
}
exports.SlugField = SlugField;
//# sourceMappingURL=SlugField.cjs.map
