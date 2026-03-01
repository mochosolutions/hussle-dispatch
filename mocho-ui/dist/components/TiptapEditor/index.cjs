"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const material = require("@mui/material");
const react = require("@tiptap/react");
const StarterKit = require("@tiptap/starter-kit");
const Link = require("@tiptap/extension-link");
const Image = require("@tiptap/extension-image");
const Placeholder = require("@tiptap/extension-placeholder");
const MenuBar = require("./MenuBar.cjs");
const TiptapEditor = ({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = 200,
  maxHeight = 500,
  disabled = false,
  error = false,
  helperText,
  onImageSelect,
  onLinkAdd
}) => {
  const editor = react.useEditor({
    extensions: [StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6]
      }
    }), Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank"
      }
    }), Image.configure({
      inline: true,
      allowBase64: true
    }), Placeholder.configure({
      placeholder
    })],
    content: value,
    editable: !disabled,
    onUpdate: ({
      editor: updatedEditor
    }) => {
      const html = updatedEditor.getHTML();
      if (html !== value) {
        onChange(html);
      }
    }
  });
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, {
        emitUpdate: false
      });
    }
  }, [value, editor]);
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { sx: {
    border: 1,
    borderColor: error ? "error.main" : "divider",
    borderRadius: 1,
    overflow: "hidden",
    "&:focus-within": {
      borderColor: error ? "error.main" : "primary.main",
      boxShadow: (theme) => error ? `0 0 0 1px ${theme.palette.error.main}` : `0 0 0 1px ${theme.palette.primary.main}`
    }
  }, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(MenuBar.MenuBar, { editor, onImageSelect, onLinkAdd }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { sx: {
      minHeight,
      maxHeight,
      overflow: "auto",
      p: 2,
      bgcolor: disabled ? "action.disabledBackground" : "background.paper",
      "& .ProseMirror": {
        outline: "none",
        minHeight: minHeight - 32,
        // Account for padding
        "& p.is-editor-empty:first-child::before": {
          content: "attr(data-placeholder)",
          float: "left",
          color: "text.disabled",
          pointerEvents: "none",
          height: 0
        },
        "& img": {
          maxWidth: "100%",
          height: "auto",
          borderRadius: 1
        },
        "& a": {
          color: "primary.main",
          textDecoration: "underline"
        },
        "& blockquote": {
          borderLeft: 4,
          borderColor: "divider",
          pl: 2,
          ml: 0,
          color: "text.secondary",
          fontStyle: "italic"
        },
        "& pre": {
          bgcolor: "grey.100",
          borderRadius: 1,
          p: 2,
          overflow: "auto",
          "& code": {
            background: "none",
            color: "inherit",
            fontSize: "0.875rem",
            fontFamily: "monospace",
            p: 0
          }
        },
        "& code": {
          bgcolor: "grey.100",
          borderRadius: 0.5,
          px: 0.5,
          py: 0.25,
          fontSize: "0.875rem",
          fontFamily: "monospace"
        },
        "& hr": {
          border: "none",
          borderTop: 1,
          borderColor: "divider",
          my: 2
        },
        "& ul, & ol": {
          pl: 3
        },
        "& h1": {
          fontSize: "2rem",
          fontWeight: 600,
          mt: 3,
          mb: 1
        },
        "& h2": {
          fontSize: "1.5rem",
          fontWeight: 600,
          mt: 2.5,
          mb: 1
        },
        "& h3": {
          fontSize: "1.25rem",
          fontWeight: 600,
          mt: 2,
          mb: 0.5
        },
        "& h4": {
          fontSize: "1.125rem",
          fontWeight: 600,
          mt: 1.5,
          mb: 0.5
        },
        "& h5": {
          fontSize: "1rem",
          fontWeight: 600,
          mt: 1,
          mb: 0.5
        },
        "& h6": {
          fontSize: "0.875rem",
          fontWeight: 600,
          mt: 1,
          mb: 0.5
        },
        "& p": {
          mb: 1
        }
      }
    }, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(react.EditorContent, { editor }) }),
    helperText && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.FormHelperText, { error, sx: {
      mx: 2,
      mb: 1
    }, children: helperText })
  ] });
};
exports.TiptapEditor = TiptapEditor;
exports.default = TiptapEditor;
//# sourceMappingURL=index.cjs.map
