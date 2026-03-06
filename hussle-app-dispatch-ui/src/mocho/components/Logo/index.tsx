import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';

export interface LogoProps {
  /** Image source URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Width of the logo */
  width?: number | string;
  /** Height of the logo */
  height?: number | string;
  /** Text to display as fallback or alongside logo */
  text?: string;
  /** Whether to show text only (no image) */
  textOnly?: boolean;
  /** Link to navigate to when clicked */
  to?: string;
  /** Whether this is the mini/collapsed version */
  isIcon?: boolean;
  /** Use reversed/light version of logo (for dark backgrounds) */
  reverse?: boolean;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

export const Logo: React.FC<LogoProps> = ({
  src,
  alt = 'Logo',
  width = 'auto',
  height = 40,
  text,
  textOnly = false,
  to,
  isIcon = false,
  reverse = false,
  sx,
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: to ? 'pointer' : 'default',
        ...sx,
      }}
    >
      {!textOnly && src && (
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{
            width: isIcon ? 32 : width,
            height: isIcon ? 32 : height,
            objectFit: 'contain',
          }}
        />
      )}
      {text && !isIcon && (
        <Typography
          variant="h5"
          component="span"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </Typography>
      )}
      {!src && !text && (
        <Typography
          variant="h5"
          component="span"
          sx={{
            fontWeight: 600,
            color: 'primary.main',
          }}
        >
          {isIcon ? 'M' : 'Logo'}
        </Typography>
      )}
    </Box>
  );

  if (to) {
    return (
      <a href={to} style={{ textDecoration: 'none' }}>
        {content}
      </a>
    );
  }

  return content;
};

export default Logo;
