import { jsxs, jsx, Fragment } from "../../node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.browser.esm.js";
import { useRef } from "react";
import { ToggleButtonGroup, ToggleButton, Divider, IconButton, Tooltip, Box } from "@mui/material";
import { FormatBold, FormatItalic, FormatStrikethrough, Code, FormatListBulleted, FormatListNumbered, FormatQuote, Link, Image, HorizontalRule, FormatClear, Undo, Redo } from "@mui/icons-material";
const MenuBar = ({
  editor,
  onImageSelect,
  onLinkAdd
}) => {
  const fileInputRef = useRef(null);
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
  return /* @__PURE__ */ jsxs(Box, { sx: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 0.5,
    p: 1,
    borderBottom: 1,
    borderColor: "divider",
    bgcolor: "background.default"
  }, children: [
    /* @__PURE__ */ jsxs(ToggleButtonGroup, { size: "small", "aria-label": "text formatting", children: [
      /* @__PURE__ */ jsx(ToggleButton, { value: "bold", "aria-label": "bold", selected: editor.isActive("bold"), onClick: () => editor.chain().focus().toggleBold().run(), children: /* @__PURE__ */ jsx(FormatBold, { fontSize: "small" }) }),
      /* @__PURE__ */ jsx(ToggleButton, { value: "italic", "aria-label": "italic", selected: editor.isActive("italic"), onClick: () => editor.chain().focus().toggleItalic().run(), children: /* @__PURE__ */ jsx(FormatItalic, { fontSize: "small" }) }),
      /* @__PURE__ */ jsx(ToggleButton, { value: "strike", "aria-label": "strikethrough", selected: editor.isActive("strike"), onClick: () => editor.chain().focus().toggleStrike().run(), children: /* @__PURE__ */ jsx(FormatStrikethrough, { fontSize: "small" }) }),
      /* @__PURE__ */ jsx(ToggleButton, { value: "code", "aria-label": "code", selected: editor.isActive("code"), onClick: () => editor.chain().focus().toggleCode().run(), children: /* @__PURE__ */ jsx(Code, { fontSize: "small" }) })
    ] }),
    /* @__PURE__ */ jsx(Divider, { orientation: "vertical", flexItem: true, sx: {
      mx: 0.5
    } }),
    /* @__PURE__ */ jsxs(ToggleButtonGroup, { size: "small", "aria-label": "lists", children: [
      /* @__PURE__ */ jsx(ToggleButton, { value: "bulletList", "aria-label": "bullet list", selected: editor.isActive("bulletList"), onClick: () => editor.chain().focus().toggleBulletList().run(), children: /* @__PURE__ */ jsx(FormatListBulleted, { fontSize: "small" }) }),
      /* @__PURE__ */ jsx(ToggleButton, { value: "orderedList", "aria-label": "ordered list", selected: editor.isActive("orderedList"), onClick: () => editor.chain().focus().toggleOrderedList().run(), children: /* @__PURE__ */ jsx(FormatListNumbered, { fontSize: "small" }) })
    ] }),
    /* @__PURE__ */ jsx(Divider, { orientation: "vertical", flexItem: true, sx: {
      mx: 0.5
    } }),
    /* @__PURE__ */ jsxs(ToggleButtonGroup, { size: "small", "aria-label": "block elements", children: [
      /* @__PURE__ */ jsx(ToggleButton, { value: "blockquote", "aria-label": "blockquote", selected: editor.isActive("blockquote"), onClick: () => editor.chain().focus().toggleBlockquote().run(), children: /* @__PURE__ */ jsx(FormatQuote, { fontSize: "small" }) }),
      /* @__PURE__ */ jsx(ToggleButton, { value: "codeBlock", "aria-label": "code block", selected: editor.isActive("codeBlock"), onClick: () => editor.chain().focus().toggleCodeBlock().run(), children: /* @__PURE__ */ jsx(Code, { fontSize: "small" }) })
    ] }),
    /* @__PURE__ */ jsx(Divider, { orientation: "vertical", flexItem: true, sx: {
      mx: 0.5
    } }),
    /* @__PURE__ */ jsx(Tooltip, { title: "Add Link", children: /* @__PURE__ */ jsx(IconButton, { size: "small", onClick: handleLinkClick, color: editor.isActive("link") ? "primary" : "default", children: /* @__PURE__ */ jsx(Link, { fontSize: "small" }) }) }),
    onImageSelect && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileChange, accept: "image/*", style: {
        display: "none"
      } }),
      /* @__PURE__ */ jsx(Tooltip, { title: "Insert Image", children: /* @__PURE__ */ jsx(IconButton, { size: "small", onClick: handleImageButtonClick, children: /* @__PURE__ */ jsx(Image, { fontSize: "small" }) }) })
    ] }),
    /* @__PURE__ */ jsx(Tooltip, { title: "Horizontal Rule", children: /* @__PURE__ */ jsx(IconButton, { size: "small", onClick: () => editor.chain().focus().setHorizontalRule().run(), children: /* @__PURE__ */ jsx(HorizontalRule, { fontSize: "small" }) }) }),
    /* @__PURE__ */ jsx(Divider, { orientation: "vertical", flexItem: true, sx: {
      mx: 0.5
    } }),
    /* @__PURE__ */ jsx(Tooltip, { title: "Clear Formatting", children: /* @__PURE__ */ jsx(IconButton, { size: "small", onClick: () => editor.chain().focus().clearNodes().unsetAllMarks().run(), children: /* @__PURE__ */ jsx(FormatClear, { fontSize: "small" }) }) }),
    /* @__PURE__ */ jsx(Box, { sx: {
      flexGrow: 1
    } }),
    /* @__PURE__ */ jsx(Tooltip, { title: "Undo", children: /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(IconButton, { size: "small", onClick: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo(), children: /* @__PURE__ */ jsx(Undo, { fontSize: "small" }) }) }) }),
    /* @__PURE__ */ jsx(Tooltip, { title: "Redo", children: /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(IconButton, { size: "small", onClick: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo(), children: /* @__PURE__ */ jsx(Redo, { fontSize: "small" }) }) }) })
  ] });
};
export {
  MenuBar,
  MenuBar as default
};
//# sourceMappingURL=MenuBar.js.map
