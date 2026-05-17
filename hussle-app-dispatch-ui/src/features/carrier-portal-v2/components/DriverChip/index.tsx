import { Box, ButtonBase, Tooltip } from '@mui/material';
import { EditOutlined, LinkOutlined } from '@mui/icons-material';

import { Body, BodyMuted } from 'components/Typography';

export type DriverChipStatus = 'default' | 'overridden';

interface DriverChipProps {
  initials: string;
  name: string;
  subLabel: string;
  status: DriverChipStatus;
  active?: boolean;
  onClick?: () => void;
}

const STATUS_TOKENS: Record<
  DriverChipStatus,
  { color: string; icon: React.ReactNode; tooltip: string }
> = {
  default: {
    color: 'text.secondary',
    icon: <LinkOutlined sx={{ fontSize: 14 }} />,
    tooltip: 'Inherits fleet default',
  },
  overridden: {
    color: 'primary.main',
    icon: <EditOutlined sx={{ fontSize: 14 }} />,
    tooltip: 'Customized override',
  },
};

const DriverChip: React.FC<DriverChipProps> = ({
  initials,
  name,
  subLabel,
  status,
  active = false,
  onClick,
}) => {
  const statusTokens = STATUS_TOKENS[status];
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        pl: 1,
        pr: 1.5,
        py: 1,
        border: '1.5px solid',
        borderColor: active ? 'primary.main' : 'grey.200',
        borderRadius: '999px',
        bgcolor: active ? 'background.paper' : 'background.paper',
        background: active ? 'linear-gradient(180deg, #eff6ff, #fff 70%)' : undefined,
        boxShadow: active ? '0 0 0 3px rgba(37, 99, 235, 0.10)' : 'none',
        color: active ? 'primary.dark' : 'text.primary',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        flexShrink: 0,
        transition: 'all 0.15s ease',
        '&:hover': active ? undefined : { borderColor: 'grey.300' },
      }}
    >
      <Box
        sx={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          bgcolor: active ? 'primary.main' : 'primary.dark',
          color: 'common.white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}
      >
        {initials}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
        <Body sx={{ fontSize: 13, fontWeight: 600, color: 'inherit' }}>{name}</Body>
        <BodyMuted
          sx={{
            fontSize: 10.5,
            fontWeight: 500,
            mt: 0.125,
            color: active ? 'primary.main' : 'text.secondary',
          }}
        >
          {subLabel}
        </BodyMuted>
      </Box>
      <Tooltip title={statusTokens.tooltip} placement="top" arrow>
        <Box
          aria-label={statusTokens.tooltip}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            ml: 0.5,
            color: statusTokens.color,
            flexShrink: 0,
          }}
        >
          {statusTokens.icon}
        </Box>
      </Tooltip>
    </ButtonBase>
  );
};

export default DriverChip;
