import { default as React } from 'react';
interface PageHeaderProps {
    showBackButton?: boolean;
    onNavigate?: () => void;
    title: string;
    subtitle?: string;
    headerActions?: React.ReactNode;
}
export declare const PageHeader: React.FC<PageHeaderProps>;
export default PageHeader;
//# sourceMappingURL=index.d.ts.map