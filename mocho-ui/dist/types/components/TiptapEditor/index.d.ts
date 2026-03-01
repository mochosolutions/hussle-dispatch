import { default as React } from 'react';
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
    onImageSelect?: (file: File) => {
        blobUrl: string;
        placeholderId: string;
    };
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
export declare const TiptapEditor: React.FC<TiptapEditorProps>;
export default TiptapEditor;
//# sourceMappingURL=index.d.ts.map