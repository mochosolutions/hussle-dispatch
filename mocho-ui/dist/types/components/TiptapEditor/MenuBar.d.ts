import { default as React } from 'react';
import { Editor } from '@tiptap/react';
export interface MenuBarProps {
    editor: Editor | null;
    /** Callback when user selects an image file - receives the file and returns blob URL and placeholder ID */
    onImageSelect?: (file: File) => {
        blobUrl: string;
        placeholderId: string;
    };
    onLinkAdd?: () => void;
}
/**
 * MenuBar - Toolbar for TiptapEditor
 */
export declare const MenuBar: React.FC<MenuBarProps>;
export default MenuBar;
//# sourceMappingURL=MenuBar.d.ts.map