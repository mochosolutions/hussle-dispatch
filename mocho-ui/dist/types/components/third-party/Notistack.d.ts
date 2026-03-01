import { ReactNode } from 'react';
export interface NotistackProps {
    /** Child components */
    children: ReactNode;
    /** Maximum number of snackbars to display at once (default: 3) */
    maxSnack?: number;
    /** Use dense spacing (default: false) */
    dense?: boolean;
    /** Icon variant: 'useemojis' to show icons, 'hide' to hide icons, undefined for default */
    iconVariant?: 'useemojis' | 'hide';
}
declare const Notistack: ({ children, maxSnack, dense, iconVariant, }: NotistackProps) => import("@emotion/react/jsx-runtime").JSX.Element;
export default Notistack;
//# sourceMappingURL=Notistack.d.ts.map