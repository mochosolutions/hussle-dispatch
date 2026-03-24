import type { ReactNode } from 'react';
interface EmailLayoutProps {
    preview: string;
    headerTitle: string;
    headerSubtitle?: string;
    children: ReactNode;
}
declare const EmailLayout: ({ preview, headerTitle, headerSubtitle, children }: EmailLayoutProps) => import("react/jsx-runtime").JSX.Element;
export default EmailLayout;
