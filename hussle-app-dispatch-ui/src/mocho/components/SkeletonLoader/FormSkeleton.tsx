import { Box, Skeleton, Stack, Divider } from '@mui/material';

/**
 * Form Skeleton Props
 */
export interface FormSkeletonProps {
  /**
   * Number of form fields to display
   * @default 5
   */
  fields?: number;

  /**
   * Show back button skeleton
   * @default true
   */
  showBackButton?: boolean;

  /**
   * Show form title skeleton
   * @default true
   */
  showTitle?: boolean;

  /**
   * Show action buttons (Submit, Cancel) skeleton
   * @default true
   */
  showActions?: boolean;

  /**
   * Show rich text editor skeleton
   * @default false
   */
  showRichEditor?: boolean;

  /**
   * Spacing between form fields
   * @default 3
   */
  fieldSpacing?: number;

  /**
   * Wrap form in card
   * @default true
   */
  showCard?: boolean;
}

/**
 * Form Skeleton Component
 * Displays a skeleton loader for form views (Create/Edit pages)
 *
 * @example
 * {isLoading && <FormSkeleton fields={8} />}
 *
 * @example
 * <FormSkeleton
 *   fields={5}
 *   showTitle={true}
 *   showBackButton={true}
 *   showRichEditor={true}
 * />
 */
export function FormSkeleton({
  fields = 5,
  showBackButton = true,
  showTitle = true,
  showActions = true,
  showRichEditor = false,
  fieldSpacing = 3,
  showCard = true,
}: FormSkeletonProps): JSX.Element {
  const content = (
    <Box
      sx={{
        width: '100%',
        padding: showCard ? 3 : 0,
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading form"
    >
      {/* Header section with back button and title */}
      {showBackButton && (
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
        </Box>
      )}

      {showTitle && (
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width="40%" height={40} />
        </Box>
      )}

      {/* Form fields */}
      <Stack spacing={fieldSpacing}>
        {Array.from({ length: fields }).map((_, index) => (
          <Box key={index}>
            {/* Field label */}
            <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />

            {/* Field input - varied heights for visual variety */}
            <Skeleton
              variant="rectangular"
              width="100%"
              height={index % 3 === 1 ? 100 : 56}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        ))}

        {/* Rich text editor skeleton (if enabled) */}
        {showRichEditor && (
          <Box>
            <Skeleton variant="text" width={150} height={24} sx={{ mb: 1 }} />
            {/* Editor toolbar */}
            <Skeleton
              variant="rectangular"
              width="100%"
              height={48}
              sx={{ borderRadius: '4px 4px 0 0', mb: 0.5 }}
            />
            {/* Editor content area */}
            <Skeleton
              variant="rectangular"
              width="100%"
              height={200}
              sx={{ borderRadius: '0 0 4px 4px' }}
            />
          </Box>
        )}
      </Stack>

      {/* Action buttons */}
      {showActions && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end',
            }}
          >
            <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
          </Box>
        </>
      )}
    </Box>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
      }}
    >
      {content}
    </Box>
  );
}

export default FormSkeleton;
