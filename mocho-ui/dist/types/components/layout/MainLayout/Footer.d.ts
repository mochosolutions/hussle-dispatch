import { ReactNode } from 'react';
export interface LayoutFooterProps {
    children?: ReactNode;
    copyright?: string;
    links?: Array<{
        label: string;
        href: string;
        external?: boolean;
    }>;
}
declare const Footer: ({ children, copyright, links }: LayoutFooterProps) => import("@emotion/react/jsx-runtime").JSX.Element;
export default Footer;
//# sourceMappingURL=Footer.d.ts.map