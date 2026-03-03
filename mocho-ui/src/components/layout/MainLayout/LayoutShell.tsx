import type {ReactNode} from 'react';

// material-ui
import type {SxProps, Theme} from '@mui/material/styles';
import {Box} from '@mui/material';

// ==============================|| MAIN LAYOUT - SHELL ||============================== //

export interface LayoutShellProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

const LayoutShell = ({children, sx}: LayoutShellProps) => (
  <Box sx={{display: 'flex', width: '100%', ...((sx ?? {}) as Record<string, unknown>)}}>
    {children}
  </Box>
);

export default LayoutShell;
