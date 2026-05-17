import type { ReactNode } from 'react';
import { Box, Button } from '@mui/material';
import {
  CheckCircleOutline,
  DownloadOutlined,
  HelpOutline,
  SearchOutlined,
} from '@mui/icons-material';

import { BodyMuted } from 'components/Typography';

interface DocuSealStageProps {
  pageLabel?: string;
  onDownload?: () => void;
  onZoom?: () => void;
  onHelp?: () => void;
  children: ReactNode;
}

const ToolbarButton: React.FC<{
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ icon, label, onClick }) => (
  <Button
    variant="outlined"
    onClick={onClick}
    startIcon={icon}
    sx={{
      textTransform: 'none',
      fontWeight: 500,
      fontSize: 11.5,
      color: 'text.secondary',
      borderColor: 'grey.200',
      bgcolor: 'background.paper',
      px: 1.25,
      py: 0.5,
      minWidth: 0,
      borderRadius: 0.5,
      '& .MuiButton-startIcon': { mr: 0.5, '& svg': { fontSize: 13 } },
      '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.300' },
    }}
  >
    {label}
  </Button>
);

const DocuSealStage: React.FC<DocuSealStageProps> = ({
  pageLabel,
  onDownload,
  onZoom,
  onHelp,
  children,
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 820,
        mx: 'auto',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1,
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.25,
          px: 1.75,
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'grey.50',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.secondary' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.625,
              px: 1,
              py: 0.25,
              borderRadius: '999px',
              bgcolor: 'rgba(238, 242, 255, 1)',
              color: 'rgba(55, 48, 163, 1)',
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: '0.02em',
              '& svg': { fontSize: 12 },
            }}
          >
            <CheckCircleOutline />
            DocuSeal
          </Box>
          {pageLabel ? (
            <BodyMuted sx={{ fontSize: 11.5, fontWeight: 500 }}>{pageLabel}</BodyMuted>
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <ToolbarButton
            icon={<DownloadOutlined />}
            label="Download draft"
            onClick={onDownload}
          />
          <ToolbarButton icon={<SearchOutlined />} label="Zoom" onClick={onZoom} />
          <ToolbarButton icon={<HelpOutline />} label="Help" onClick={onHelp} />
        </Box>
      </Box>

      <Box
        sx={{
          bgcolor: 'grey.200',
          px: { xs: 2, md: 3 },
          py: { xs: 2.5, md: 3.5 },
          flex: 1,
          minHeight: 480,
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DocuSealStage;
