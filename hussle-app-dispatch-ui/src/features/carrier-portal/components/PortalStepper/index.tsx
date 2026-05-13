import { Box, Container, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

interface PortalStepperProps {
  phases: string[];
  activePhase: number;
  completedPhases: number[];
  onPhaseClick?: (phaseNumber: number) => void;
}

const resolveLabelColor = (isCompleted: boolean, isActive: boolean): string => {
  if (isCompleted) {
    return 'success.main';
  }
  if (isActive) {
    return 'text.primary';
  }
  return 'text.disabled';
};

const PortalStepper: React.FC<PortalStepperProps> = ({
  phases,
  activePhase,
  completedPhases,
  onPhaseClick,
}) => (
  <Box
    sx={{
      bgcolor: 'background.paper',
      borderBottom: 1,
      borderColor: 'divider',
    }}
  >
    <Container maxWidth="lg" sx={{ py: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {phases.map((label, index) => {
          const phaseNumber = index + 1;
          const isCompleted = completedPhases.includes(phaseNumber);
          const isActive = phaseNumber === activePhase;
          const isClickable = Boolean(isCompleted && onPhaseClick);

          const handleClick = () => {
            if (isClickable && onPhaseClick) {
              onPhaseClick(phaseNumber);
            }
          };

          return (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <Box
                onClick={handleClick}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  position: 'relative',
                  cursor: isClickable ? 'pointer' : 'default',
                  minWidth: 0,
                  py: 1,
                  '&:hover': isClickable ? { opacity: 0.8 } : undefined,
                }}
              >
                {isCompleted ? (
                  <CheckCircle sx={{ fontSize: 22, color: 'success.main', flexShrink: 0 }} />
                ) : (
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      bgcolor: isActive ? 'primary.main' : 'transparent',
                      border: isActive ? 'none' : '2px solid',
                      borderColor: 'grey.300',
                      color: isActive ? 'common.white' : 'text.disabled',
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} lineHeight={1}>
                      {phaseNumber}
                    </Typography>
                  </Box>
                )}

                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: isActive ? 700 : 500,
                    color: resolveLabelColor(isCompleted, isActive),
                    display: { xs: isActive ? 'block' : 'none', sm: 'block' },
                  }}
                >
                  {label}
                </Typography>

                {isActive ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: -12,
                      height: 2,
                      bgcolor: 'primary.main',
                    }}
                  />
                ) : null}
              </Box>

              {index < phases.length - 1 ? (
                <Box
                  sx={{
                    flex: 1,
                    height: 2,
                    mx: 1.5,
                    minWidth: 16,
                    bgcolor: isCompleted ? 'success.main' : 'grey.200',
                    borderRadius: 1,
                  }}
                />
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Container>
  </Box>
);

export default PortalStepper;
