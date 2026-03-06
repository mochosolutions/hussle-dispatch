/**
 * StateInspector component for visualizing Redux state in Storybook
 *
 * Displays formatted JSON state with optional path highlighting.
 */

import { Box, Typography, Paper } from '@mui/material';

export interface StateInspectorProps {
  /** Title displayed above the state viewer */
  title: string;
  /** The state object to display */
  state: unknown;
  /** Optional path to highlight (e.g., "loading.getAll") */
  highlightPath?: string;
  /** Maximum height of the scrollable area (default: 400) */
  maxHeight?: number;
}

/**
 * Component for displaying Redux state as formatted JSON
 *
 * @example
 * ```tsx
 * <StateInspector
 *   title="Page State"
 *   state={{ loading: { getAll: 'Pending' }, errors: {} }}
 *   highlightPath="loading.getAll"
 * />
 * ```
 */
export function StateInspector({
  title,
  state,
  highlightPath,
  maxHeight = 400,
}: StateInspectorProps) {
  const formattedState = JSON.stringify(state, null, 2);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        backgroundColor: 'grey.50',
        borderColor: 'grey.300',
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>

      {highlightPath && (
        <Box
          sx={{
            mb: 1,
            px: 1,
            py: 0.5,
            backgroundColor: 'primary.light',
            borderRadius: 1,
            display: 'inline-block',
          }}
        >
          <Typography variant="caption" color="primary.contrastText">
            {highlightPath}
          </Typography>
        </Box>
      )}

      <Box
        component="pre"
        role="region"
        aria-label={`${title} state viewer`}
        sx={{
          m: 0,
          p: 1.5,
          backgroundColor: 'grey.900',
          color: 'grey.100',
          borderRadius: 1,
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          overflow: 'auto',
          maxHeight,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {formattedState}
      </Box>
    </Paper>
  );
}
