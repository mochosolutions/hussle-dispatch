/**
 * List Skeleton Props
 */
export interface ListSkeletonProps {
    /**
     * Number of skeleton rows to display
     * @default 5
     */
    rows?: number;
    /**
     * Show header skeleton
     * @default true
     */
    showHeader?: boolean;
    /**
     * Show action buttons skeleton
     * @default true
     */
    showActions?: boolean;
    /**
     * Height of each row
     * @default 60
     */
    rowHeight?: number;
    /**
     * Spacing between rows
     * @default 1
     */
    rowSpacing?: number;
}
/**
 * List Skeleton Component
 * Displays a skeleton loader for list/table views (AG Grid, DataGrid)
 *
 * @example
 * {isLoading && <ListSkeleton rows={10} />}
 *
 * @example
 * <ListSkeleton
 *   rows={5}
 *   showHeader={true}
 *   showActions={true}
 * />
 */
export declare function ListSkeleton({ rows, showHeader, showActions, rowHeight, rowSpacing, }: ListSkeletonProps): JSX.Element;
export default ListSkeleton;
//# sourceMappingURL=ListSkeleton.d.ts.map