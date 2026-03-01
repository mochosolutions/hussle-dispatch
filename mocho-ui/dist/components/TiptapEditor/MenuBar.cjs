"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const emotionReactJsxRuntime_browser_esm = require("../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.cjs");
const React = require("react");
const material = require("@mui/material");
const iconsMaterial = require("@mui/icons-material");
const MenuBar = ({
  editor,
  onImageSelect,
  onLinkAdd
}) => {
  const fileInputRef = React.useRef(null);
  if (!editor) {
    return null;
  }
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && onImageSelect) {
      const result = onImageSelect(file);
      editor.chain().focus().setImage({
        src: result.blobUrl,
        alt: file.name
      }).run();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleLinkClick = () => {
    if (onLinkAdd) {
      onLinkAdd();
    } else {
      const previousUrl = editor.getAttributes("link").href;
      const url = window.prompt("Enter URL", previousUrl);
      if (url === null) {
        return;
      }
      if (url === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }
      editor.chain().focus().extendMarkRange("link").setLink({
        href: url
      }).run();
    }
  };
  return /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.Box, { sx: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 0.5,
    p: 1,
    borderBottom: 1,
    borderColor: "divider",
    bgcolor: "background.default"
  }, children: [
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ToggleButtonGroup, { size: "small", "aria-label": "text formatting", children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ToggleButton, { value: "bold", "aria-label": "bold", selected: editor.isActive("bold"), onClick: () => editor.chain().focus().toggleBold().run(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.FormatBold, { fontSize: "small" }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ToggleButton, { value: "italic", "aria-label": "italic", selected: editor.isActive("italic"), onClick: () => editor.chain().focus().toggleItalic().run(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.FormatItalic, { fontSize: "small" }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ToggleButton, { value: "strike", "aria-label": "strikethrough", selected: editor.isActive("strike"), onClick: () => editor.chain().focus().toggleStrike().run(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.FormatStrikethrough, { fontSize: "small" }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ToggleButton, { value: "code", "aria-label": "code", selected: editor.isActive("code"), onClick: () => editor.chain().focus().toggleCode().run(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.Code, { fontSize: "small" }) })
    ] }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Divider, { orientation: "vertical", flexItem: true, sx: {
      mx: 0.5
    } }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ToggleButtonGroup, { size: "small", "aria-label": "lists", children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ToggleButton, { value: "bulletList", "aria-label": "bullet list", selected: editor.isActive("bulletList"), onClick: () => editor.chain().focus().toggleBulletList().run(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.FormatListBulleted, { fontSize: "small" }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ToggleButton, { value: "orderedList", "aria-label": "ordered list", selected: editor.isActive("orderedList"), onClick: () => editor.chain().focus().toggleOrderedList().run(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.FormatListNumbered, { fontSize: "small" }) })
    ] }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Divider, { orientation: "vertical", flexItem: true, sx: {
      mx: 0.5
    } }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(material.ToggleButtonGroup, { size: "small", "aria-label": "block elements", children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ToggleButton, { value: "blockquote", "aria-label": "blockquote", selected: editor.isActive("blockquote"), onClick: () => editor.chain().focus().toggleBlockquote().run(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.FormatQuote, { fontSize: "small" }) }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.ToggleButton, { value: "codeBlock", "aria-label": "code block", selected: editor.isActive("codeBlock"), onClick: () => editor.chain().focus().toggleCodeBlock().run(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.Code, { fontSize: "small" }) })
    ] }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Divider, { orientation: "vertical", flexItem: true, sx: {
      mx: 0.5
    } }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { title: "Add Link", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.IconButton, { size: "small", onClick: handleLinkClick, color: editor.isActive("link") ? "primary" : "default", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.Link, { fontSize: "small" }) }) }),
    onImageSelect && /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsxs(emotionReactJsxRuntime_browser_esm.Fragment, { children: [
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileChange, accept: "image/*", style: {
        display: "none"
      } }),
      /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { title: "Insert Image", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.IconButton, { size: "small", onClick: handleImageButtonClick, children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.Image, { fontSize: "small" }) }) })
    ] }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { title: "Horizontal Rule", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.IconButton, { size: "small", onClick: () => editor.chain().focus().setHorizontalRule().run(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.HorizontalRule, { fontSize: "small" }) }) }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Divider, { orientation: "vertical", flexItem: true, sx: {
      mx: 0.5
    } }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { title: "Clear Formatting", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.IconButton, { size: "small", onClick: () => editor.chain().focus().clearNodes().unsetAllMarks().run(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.FormatClear, { fontSize: "small" }) }) }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Box, { sx: {
      flexGrow: 1
    } }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { title: "Undo", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("span", { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.IconButton, { size: "small", onClick: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.Undo, { fontSize: "small" }) }) }) }),
    /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.Tooltip, { title: "Redo", children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx("span", { children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(material.IconButton, { size: "small", onClick: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo(), children: /* @__PURE__ */ emotionReactJsxRuntime_browser_esm.jsx(iconsMaterial.Redo, { fontSize: "small" }) }) }) })
  ] });
};
exports.MenuBar = MenuBar;
exports.default = MenuBar;
//# sourceMappingURL=MenuBar.cjs.map
