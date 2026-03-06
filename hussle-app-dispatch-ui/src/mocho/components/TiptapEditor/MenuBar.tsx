import React, { useRef } from 'react';
import { Box, IconButton, Divider, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatStrikethrough,
  Code,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  HorizontalRule,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  FormatClear,
} from '@mui/icons-material';
import type { Editor } from '@tiptap/react';

export interface MenuBarProps {
  editor: Editor | null;
  /** Callback when user selects an image file - receives the file and returns blob URL and placeholder ID */
  onImageSelect?: (file: File) => { blobUrl: string; placeholderId: string };
  onLinkAdd?: () => void;
}

/**
 * MenuBar - Toolbar for TiptapEditor
 */
export const MenuBar: React.FC<MenuBarProps> = ({ editor, onImageSelect, onLinkAdd }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageSelect) {
      const result = onImageSelect(file);
      // Insert the blob URL as a placeholder image
      editor.chain().focus().setImage({ src: result.blobUrl, alt: file.name }).run();
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLinkClick = () => {
    if (onLinkAdd) {
      onLinkAdd();
    } else {
      const previousUrl = editor.getAttributes('link').href;
      const url = window.prompt('Enter URL', previousUrl);

      if (url === null) {
        return;
      }

      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }

      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 0.5,
        p: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      {/* Text formatting */}
      <ToggleButtonGroup size="small" aria-label="text formatting">
        <ToggleButton
          value="bold"
          aria-label="bold"
          selected={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <FormatBold fontSize="small" />
        </ToggleButton>
        <ToggleButton
          value="italic"
          aria-label="italic"
          selected={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <FormatItalic fontSize="small" />
        </ToggleButton>
        <ToggleButton
          value="strike"
          aria-label="strikethrough"
          selected={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <FormatStrikethrough fontSize="small" />
        </ToggleButton>
        <ToggleButton
          value="code"
          aria-label="code"
          selected={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Lists */}
      <ToggleButtonGroup size="small" aria-label="lists">
        <ToggleButton
          value="bulletList"
          aria-label="bullet list"
          selected={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <FormatListBulleted fontSize="small" />
        </ToggleButton>
        <ToggleButton
          value="orderedList"
          aria-label="ordered list"
          selected={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <FormatListNumbered fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Block elements */}
      <ToggleButtonGroup size="small" aria-label="block elements">
        <ToggleButton
          value="blockquote"
          aria-label="blockquote"
          selected={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <FormatQuote fontSize="small" />
        </ToggleButton>
        <ToggleButton
          value="codeBlock"
          aria-label="code block"
          selected={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Insert elements */}
      <Tooltip title="Add Link">
        <IconButton
          size="small"
          onClick={handleLinkClick}
          color={editor.isActive('link') ? 'primary' : 'default'}
        >
          <LinkIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {onImageSelect && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <Tooltip title="Insert Image">
            <IconButton size="small" onClick={handleImageButtonClick}>
              <ImageIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}

      <Tooltip title="Horizontal Rule">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <HorizontalRule fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Clear formatting */}
      <Tooltip title="Clear Formatting">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          <FormatClear fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Undo/Redo */}
      <Box sx={{ flexGrow: 1 }} />

      <Tooltip title="Undo">
        <span>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Redo">
        <span>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default MenuBar;
