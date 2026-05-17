import type { ReactNode } from 'react';
import { Box, LinearProgress } from '@mui/material';

import { Body, BodyMuted } from 'components/Typography';

export type UploadFileRowState = 'uploading' | 'uploaded' | 'error';

interface UploadFileRowProps {
  state: UploadFileRowState;
  thumbnail: ReactNode;
  filename: string;
  meta?: ReactNode;
  errorText?: string;
  progressPercent?: number;
  actions?: ReactNode;
}

const BORDER_TOKENS: Record<UploadFileRowState, { borderColor: string; bgcolor: string }> = {
  uploading: { borderColor: 'grey.200', bgcolor: 'background.paper' },
  uploaded: { borderColor: 'rgba(187, 247, 208, 1)', bgcolor: 'background.paper' },
  error: { borderColor: 'rgba(254, 202, 202, 1)', bgcolor: 'rgba(254, 247, 247, 1)' },
};

const UploadFileRow: React.FC<UploadFileRowProps> = ({
  state,
  thumbnail,
  filename,
  meta,
  errorText,
  progressPercent,
  actions,
}) => {
  const tokens = BORDER_TOKENS[state];
  const isUploading = state === 'uploading';
  const isError = state === 'error';

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '44px 1fr', sm: '44px 1fr auto' },
        gap: 1.75,
        alignItems: 'center',
        px: 1.75,
        py: 1.5,
        border: '1px solid',
        borderColor: tokens.borderColor,
        borderRadius: 0.75,
        bgcolor: tokens.bgcolor,
      }}
    >
      <Box sx={{ display: 'flex' }}>{thumbnail}</Box>

      <Box sx={{ minWidth: 0 }}>
        <Body
          sx={{
            fontSize: 13.5,
            fontWeight: 600,
            color: 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {filename}
        </Body>

        <BodyMuted
          sx={{
            fontSize: 11.5,
            mt: 0.25,
            display: 'flex',
            gap: 0.75,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {isError && errorText ? (
            <Box
              component="span"
              sx={{ color: 'error.main', fontWeight: 500 }}
            >
              {errorText}
            </Box>
          ) : (
            meta
          )}
        </BodyMuted>

        {isUploading && typeof progressPercent === 'number' ? (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, progressPercent))}
            sx={{
              mt: 1,
              height: 6,
              borderRadius: 0.375,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'primary.main',
                transition: 'transform 0.3s',
              },
            }}
          />
        ) : null}
      </Box>

      {actions ? (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexShrink: 0,
            alignItems: 'center',
            gridColumn: { xs: '1 / -1', sm: 'auto' },
            justifyContent: { xs: 'flex-end', sm: 'flex-start' },
          }}
        >
          {actions}
        </Box>
      ) : null}
    </Box>
  );
};

export default UploadFileRow;
