import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { useCallback } from "react";
import { Stack, InputLabel } from "@mui/material";
import { TiptapEditor } from "../../TiptapEditor/index.js";
const RichTextEditorField = ({
  name,
  label,
  required = false,
  placeholder,
  minHeight = 400,
  maxHeight = 600,
  onImageSelect,
  formik
}) => {
  const value = formik.values[name] || "";
  const error = formik.errors[name];
  const touched = formik.touched[name];
  const hasError = Boolean(touched && error);
  const handleChange = useCallback((html) => {
    formik.setFieldValue(name, html);
  }, [formik, name]);
  return /* @__PURE__ */ jsxs(Stack, { spacing: 1, children: [
    /* @__PURE__ */ jsx(InputLabel, { required, children: label }),
    /* @__PURE__ */ jsx(TiptapEditor, { value, onChange: handleChange, onImageSelect, placeholder, minHeight, maxHeight, error: hasError, helperText: hasError ? error : void 0 })
  ] });
};
export {
  RichTextEditorField
};
//# sourceMappingURL=index.js.map
