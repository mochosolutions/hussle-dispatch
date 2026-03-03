import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { Link, Stack, Typography } from '@mui/material';

export interface LayoutFooterProps {
  children?: ReactNode;
  copyright?: string;
  links?: Array<{ label: string; href: string; external?: boolean }>;
}

const Footer = ({ children, copyright, links }: LayoutFooterProps) => {
  if (children) {
    return (
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ p: '24px 16px 0px', mt: 'auto' }}
      >
        {children}
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ p: '24px 16px 0px', mt: 'auto' }}
    >
      <Typography variant="caption">
        {copyright ?? '\u00A9 All rights reserved'}
      </Typography>
      {links && links.length > 0 && (
        <Stack
          spacing={1.5}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          {links.map((link) =>
            link.external ? (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                color="textPrimary"
              >
                {link.label}
              </Link>
            ) : (
              <Link
                key={link.label}
                component={RouterLink}
                to={link.href}
                variant="caption"
                color="textPrimary"
              >
                {link.label}
              </Link>
            ),
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default Footer;
