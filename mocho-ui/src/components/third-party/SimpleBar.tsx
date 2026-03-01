import React from 'react';
import SimpleBarReact from 'simplebar-react';
import type { Props as SimpleBarProps } from 'simplebar-react';
import { SxProps, Theme, Box } from '@mui/material';
import 'simplebar-react/dist/simplebar.min.css';

export interface SimpleBarWrapperProps extends Omit<SimpleBarProps, 'style'> {
  /** MUI sx prop for styling */
  sx?: SxProps<Theme>;
  /** Children to render inside scrollable area */
  children: React.ReactNode;
}

/**
 * SimpleBar - Custom scrollbar wrapper using simplebar-react
 *
 * Provides consistent custom scrollbars across browsers
 * with MUI sx prop support.
 */
const SimpleBar: React.FC<SimpleBarWrapperProps> = ({
  children,
  sx,
  ...props
}) => {
  return (
    <Box
      component={SimpleBarReact}
      sx={{
        maxHeight: '100%',
        '& .simplebar-scrollbar::before': {
          backgroundColor: 'grey.500',
        },
        '& .simplebar-track.simplebar-vertical': {
          width: 10,
        },
        '& .simplebar-track.simplebar-horizontal': {
          height: 10,
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default SimpleBar;
