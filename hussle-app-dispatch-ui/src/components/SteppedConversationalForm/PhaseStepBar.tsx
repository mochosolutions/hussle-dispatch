import { Box, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

import { useSteppedForm } from './useSteppedForm';

const resolveStepColor = (isCompleted: boolean, isActive: boolean): string => {
  if (isCompleted) {
    return 'success.main';
  }
  if (isActive) {
    return 'text.primary';
  }
  return 'text.disabled';
};

const PhaseStepBar: React.FC = () => {
  const { phases, activePhase, completedPhases, goToPhase } = useSteppedForm();

  // Phase numbers are 1-indexed (matching question.phase values)
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 2,
        px: 1,
        mb: 3,
        overflowX: 'auto',
      }}
    >
      {phases.map((label, index) => {
        const phaseNumber = index + 1;
        const isCompleted = completedPhases.includes(phaseNumber);
        const isActive = phaseNumber === activePhase;
        const isClickable = isCompleted;

        return (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {/* Step indicator */}
            <Box
              onClick={isClickable ? () => goToPhase(phaseNumber) : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: isClickable ? 'pointer' : 'default',
                minWidth: 0,
                '&:hover': isClickable ? { opacity: 0.8 } : undefined,
              }}
            >
              {isCompleted ? (
                <CheckCircle sx={{ fontSize: 24, color: 'success.main', flexShrink: 0 }} />
              ) : (
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    ...(isActive
                      ? { bgcolor: 'primary.main', color: 'common.white' }
                      : { border: '2px solid', borderColor: 'grey.300', color: 'text.disabled' }),
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
                  color: resolveStepColor(isCompleted, isActive),
                }}
              >
                {label}
              </Typography>
            </Box>

            {/* Connector line */}
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
  );
};

export { PhaseStepBar };
