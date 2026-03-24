interface DataTableRow {
    label: string;
    value: string;
    highlight?: boolean;
}
interface DataTableProps {
    rows: DataTableRow[];
}
declare const DataTable: ({ rows }: DataTableProps) => import("react/jsx-runtime").JSX.Element;
export default DataTable;
