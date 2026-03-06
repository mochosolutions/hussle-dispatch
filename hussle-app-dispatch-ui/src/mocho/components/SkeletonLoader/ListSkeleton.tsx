import { Box, Skeleton, Stack } from '@mui/material';

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
export function ListSkeleton({
  rows = 5,
  showHeader = true,
  showActions = true,
  rowHeight = 60,
  rowSpacing = 1,
}: ListSkeletonProps): JSX.Element {
  return (
    <Box
      sx={{
        width: '100%',
        padding: 2,
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading list data"
    >
      {/* Header section with title and action buttons */}
      {showHeader && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          {/* Title skeleton */}
          <Skeleton variant="text" width={200} height={40} />

          {/* Action buttons skeleton */}
          {showActions && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
            </Box>
          )}
        </Box>
      )}

      {/* Table header row */}
      <Skeleton
        variant="rectangular"
        width="100%"
        height={50}
        sx={{
          borderRadius: 1,
          mb: rowSpacing,
        }}
      />

      {/* Table data rows */}
      <Stack spacing={rowSpacing}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            width="100%"
            height={rowHeight}
            sx={{
              borderRadius: 1,
            }}
          />
        ))}
      </Stack>

      {/* Pagination skeleton */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mt: 2,
        }}
      >
        <Skeleton variant="rectangular" width={300} height={40} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
  );
}

export default ListSkeleton;
