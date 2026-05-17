import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';

import { Body, BodyMuted } from 'components/Typography';

interface UploadDropAreaProps {
  title: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}

const UploadDropArea: React.FC<UploadDropAreaProps> = ({
  title,
  subtitle,
  icon,
  actions,
  onClick,
}) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        border: '1.5px dashed',
        borderColor: 'grey.200',
        bgcolor: 'grey.50',
        borderRadius: 0.75,
        px: 2.5,
        py: 3.5,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'rgba(239, 246, 255, 1)',
        },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          bgcolor: 'rgba(239, 246, 255, 1)',
          color: 'primary.main',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.25,
          '& svg': { fontSize: 22 },
        }}
      >
        {icon ?? <CloudUploadOutlined />}
      </Box>
      <Body sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{title}</Body>
      {subtitle ? <BodyMuted sx={{ fontSize: 12, mt: 0.5 }}>{subtitle}</BodyMuted> : null}
      {actions ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mt: 1.5,
            flexWrap: 'wrap',
          }}
        >
          {actions}
        </Box>
      ) : null}
    </Box>
  );
};

export default UploadDropArea;
