import { default as React } from 'react';
interface AgGridTableProps {
    columnDefs: any[];
    rowData: any[];
    defaultColDef?: any;
    gridOptions?: any;
    loading?: boolean;
    error?: boolean;
    noDataMessage?: string;
    loadingComponent?: React.ReactNode;
    errorComponent?: React.ReactNode;
    noDataComponent?: React.ReactNode;
}
declare const AgGridTable: React.FC<AgGridTableProps>;
export default AgGridTable;
//# sourceMappingURL=index.d.ts.map