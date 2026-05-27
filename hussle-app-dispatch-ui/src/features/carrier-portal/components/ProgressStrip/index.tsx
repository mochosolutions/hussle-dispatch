import type { ReactNode } from 'react';
import { Box, LinearProgress } from '@mui/material';
import { TaskAltOutlined, CheckCircleOutlined } from '@mui/icons-material';

import { BodyMuted, BodyStrong } from 'components/Typography';

export type ProgressStripVariant = 'progress' | 'complete';

interface ProgressStripProps {
  title: string;
  subtitle?: string;
  value: number;
  total: number;
  variant?: ProgressStripVariant;
  icon?: ReactNode;
}

const ProgressStrip: React.FC<ProgressStripProps> = ({
  title,
  subtitle,
  value,
  total,
  variant = 'progress',
  icon,
}) => {
  const isComplete = variant === 'complete';
  const percent = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
  const accentColor = isComplete ? 'success.main' : 'primary.main';
  const iconBg = isComplete ? 'success.main' : 'primary.dark';
  const defaultIcon = isComplete ? <CheckCircleOutlined /> : <TaskAltOutlined />;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.75,
        px: 2,
        py: 1.5,
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 0.75,
        mb: 2.25,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          bgcolor: iconBg,
          color: 'common.white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          '& svg': { fontSize: 20 },
        }}
      >
        {icon ?? defaultIcon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <BodyStrong sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>{title}</BodyStrong>
        {subtitle ? (
          <BodyMuted sx={{ fontSize: 12.5, mt: 0.25 }}>{subtitle}</BodyMuted>
        ) : null}
      </Box>

      <Box sx={{ width: 180, flexShrink: 0 }}>
        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            height: 8,
            borderRadius: 0.5,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: accentColor,
              transition: 'transform 0.3s',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default ProgressStrip;
