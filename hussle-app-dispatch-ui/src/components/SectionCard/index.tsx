import { Typography } from '@mui/material';
import MainCard, { MainCardProps } from 'mocho/components/MainCard';
import React from 'react';

interface SectionCardProps extends MainCardProps {
  title: string | React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, actions, children, ...rest }) => (
  <MainCard
    title={title}
    sx={{
      border: '1px solid',
      borderColor: 'grey.200',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}
    headerSX={{
      py: 1.25,
      px: 2,
      backgroundColor: 'grey.100',
      borderBottom: '1px solid',
      borderColor: 'grey.200',
    }}
    contentSX={{ p: 1.5 }}
    content
    secondary={actions}
    {...rest}
  >
    {subtitle && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {subtitle}
      </Typography>
    )}
    {children}
  </MainCard>
);

export const DarkSectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  actions,
  children,
  ...rest
}) => (
  <MainCard
    title={title}
    sx={{
      bgcolor: 'grey.900',
      color: 'common.white',
      borderRadius: '8px',
      overflow: 'hidden',
    }}
    headerSX={{
      py: 1.25,
      px: 2,
      borderBottom: '1px solid',
      borderColor: 'grey.700',
    }}
    contentSX={{ p: 1.5 }}
    content
    secondary={actions}
    {...rest}
  >
    {subtitle && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {subtitle}
      </Typography>
    )}
    {children}
  </MainCard>
);

export default SectionCard;
