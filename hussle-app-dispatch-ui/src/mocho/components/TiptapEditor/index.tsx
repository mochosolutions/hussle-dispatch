import React, { useEffect } from 'react';
import { Box, FormHelperText } from '@mui/material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { MenuBar } from './MenuBar';

export interface TiptapEditorProps {
  /** HTML content value */
  value: string;
  /** Called when content changes */
  onChange: (html: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum editor height */
  minHeight?: number;
  /** Maximum editor height */
  maxHeight?: number;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Whether the editor has an error */
  error?: boolean;
  /** Helper/error text to display below editor */
  helperText?: string;
  /** Callback when user wants to insert an image - receives the file and returns blob URL and placeholder ID */
  onImageSelect?: (file: File) => { blobUrl: string; placeholderId: string };
  /** Callback when user wants to add a link */
  onLinkAdd?: () => void;
}

/**
 * TiptapEditor - Rich text editor based on Tiptap/ProseMirror
 *
 * Features:
 * - Text formatting (bold, italic, strikethrough, code)
 * - Lists (bullet, ordered)
 * - Block elements (blockquote, code block, horizontal rule)
 * - Links and images
 * - Undo/redo
 * - Placeholder text
 * - Error state styling
 */
export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = 200,
  maxHeight = 500,
  disabled = false,
  error = false,
  helperText,
  onImageSelect,
  onLinkAdd,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: updatedEditor }) => {
      const html = updatedEditor.getHTML();
      // Only call onChange if content actually changed
      if (html !== value) {
        onChange(html);
      }
    },
  });

  // Update content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  // Update editable state when disabled prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  return (
    <Box
      sx={{
        border: 1,
        borderColor: error ? 'error.main' : 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        '&:focus-within': {
          borderColor: error ? 'error.main' : 'primary.main',
          boxShadow: (theme) =>
            error
              ? `0 0 0 1px ${theme.palette.error.main}`
              : `0 0 0 1px ${theme.palette.primary.main}`,
        },
      }}
    >
      <MenuBar editor={editor} onImageSelect={onImageSelect} onLinkAdd={onLinkAdd} />

      <Box
        sx={{
          minHeight,
          maxHeight,
          overflow: 'auto',
          p: 2,
          bgcolor: disabled ? 'action.disabledBackground' : 'background.paper',
          '& .ProseMirror': {
            outline: 'none',
            minHeight: minHeight - 32, // Account for padding
            '& p.is-editor-empty:first-child::before': {
              content: 'attr(data-placeholder)',
              float: 'left',
              color: 'text.disabled',
              pointerEvents: 'none',
              height: 0,
            },
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 1,
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'underline',
            },
            '& blockquote': {
              borderLeft: 4,
              borderColor: 'divider',
              pl: 2,
              ml: 0,
              color: 'text.secondary',
              fontStyle: 'italic',
            },
            '& pre': {
              bgcolor: 'grey.100',
              borderRadius: 1,
              p: 2,
              overflow: 'auto',
              '& code': {
                background: 'none',
                color: 'inherit',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                p: 0,
              },
            },
            '& code': {
              bgcolor: 'grey.100',
              borderRadius: 0.5,
              px: 0.5,
              py: 0.25,
              fontSize: '0.875rem',
              fontFamily: 'monospace',
            },
            '& hr': {
              border: 'none',
              borderTop: 1,
              borderColor: 'divider',
              my: 2,
            },
            '& ul, & ol': {
              pl: 3,
            },
            '& h1': { fontSize: '2rem', fontWeight: 600, mt: 3, mb: 1 },
            '& h2': { fontSize: '1.5rem', fontWeight: 600, mt: 2.5, mb: 1 },
            '& h3': { fontSize: '1.25rem', fontWeight: 600, mt: 2, mb: 0.5 },
            '& h4': { fontSize: '1.125rem', fontWeight: 600, mt: 1.5, mb: 0.5 },
            '& h5': { fontSize: '1rem', fontWeight: 600, mt: 1, mb: 0.5 },
            '& h6': { fontSize: '0.875rem', fontWeight: 600, mt: 1, mb: 0.5 },
            '& p': { mb: 1 },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      {helperText && (
        <FormHelperText error={error} sx={{ mx: 2, mb: 1 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default TiptapEditor;
