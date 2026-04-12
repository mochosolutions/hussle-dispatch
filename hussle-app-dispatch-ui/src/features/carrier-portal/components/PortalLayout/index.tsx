import type { ReactNode } from 'react';
import { Box, LinearProgress, Link, Typography } from '@mui/material';

const PHASES = [
  'Company',
  'Equipment',
  'Drivers',
  'Cost Analysis',
  'Lane Preferences',
  'Documents',
] as const;

const TOTAL_PHASES = PHASES.length;

interface PortalLayoutProps {
  children: ReactNode;
  currentPhase: number;
  completedPhases: number[];
}

const PortalLayout: React.FC<PortalLayoutProps> = ({ children, currentPhase, completedPhases }) => {
  const progressPercent = (completedPhases.length / TOTAL_PHASES) * 100;
  const phaseLabel = PHASES[currentPhase - 1] ?? PHASES[0];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'primary.dark' }}>
      {/* Fixed Header */}
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          bgcolor: 'primary.dark',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          zIndex: 1100,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} color="common.white">
          Hussle Dispatch
        </Typography>

        <Typography
          variant="body2"
          fontWeight={500}
          sx={{
            color: 'common.white',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {phaseLabel}
        </Typography>

        <Link
          href="#"
          underline="hover"
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            '&:hover': { color: 'common.white' },
          }}
        >
          Save &amp; Exit
        </Link>
      </Box>

      {/* Content Area */}
      <Box
        component="main"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          pt: 10,
          px: 2,
          mb: 4,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 680,
            bgcolor: 'background.paper',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            p: { xs: 3, sm: 5, md: 6 },
            minHeight: 'calc(100vh - 140px)',
            mt: '56px',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Fixed Bottom Progress Bar */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }}>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: 4,
            borderRadius: 0,
            bgcolor: 'rgba(255, 255, 255, 0.12)',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'primary.main',
              borderRadius: 0,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default PortalLayout;
