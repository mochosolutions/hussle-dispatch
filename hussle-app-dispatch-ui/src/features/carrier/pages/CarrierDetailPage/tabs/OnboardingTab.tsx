import { Box, Card, Chip, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ONBOARDING_ITEMS } from '../../../constants';
import type { CarrierListItem, InsuranceWarning } from '../../../types';

interface OnboardingTabProps {
  carrier: CarrierListItem & { insuranceExpiry: string | null };
}

const getInsuranceWarningConfig = (
  warning: InsuranceWarning,
): { label: string; color: 'error' | 'warning' | 'default' } | null => {
  if (warning === 'EXPIRED') {
    return { label: 'EXPIRED', color: 'error' };
  }
  if (warning === '7_DAY') {
    return { label: 'Expires in 7 days', color: 'error' };
  }
  if (warning === '30_DAY') {
    return { label: 'Expires in 30 days', color: 'warning' };
  }
  return null;
};

export const OnboardingTab: React.FC<OnboardingTabProps> = ({ carrier }) => {
  const allComplete =
    carrier.dispatchAgreementOnFile &&
    carrier.insuranceCertOnFile &&
    carrier.w9OnFile &&
    carrier.carrierPacketOnFile;

  const docStatuses: Record<string, boolean> = {
    dispatchAgreementOnFile: carrier.dispatchAgreementOnFile,
    insuranceCertOnFile: carrier.insuranceCertOnFile,
    w9OnFile: carrier.w9OnFile,
    carrierPacketOnFile: carrier.carrierPacketOnFile,
  };

  const insuranceWarningConfig = getInsuranceWarningConfig(carrier.insuranceWarning);

  return (
    <Card>
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
        >
          Onboarding Checklist
        </Typography>
        <Chip
          label={allComplete ? 'Complete' : 'Incomplete'}
          size="small"
          color={allComplete ? 'success' : 'warning'}
          variant="outlined"
          sx={{ height: 22, fontSize: '0.75rem' }}
        />
      </Box>
      <Box sx={{ px: 3, py: 2 }}>
        <Stack spacing={1.5}>
          {ONBOARDING_ITEMS.map((item) => {
            const isComplete = docStatuses[item.key];
            return (
              <Box
                key={item.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  px: 2,
                  borderRadius: 1,
                  bgcolor: isComplete ? 'success.lighter' : 'warning.lighter',
                  border: 1,
                  borderColor: isComplete ? 'success.light' : 'warning.light',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isComplete ? (
                    <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                  ) : (
                    <CancelIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.label}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: isComplete ? 'success.main' : 'warning.main',
                    fontWeight: 600,
                  }}
                >
                  {isComplete ? 'On File' : 'Missing'}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        {/* Insurance Expiry Warning */}
        {carrier.insuranceCertOnFile && (
          <Box sx={{ mt: 2.5 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}
            >
              Insurance Status
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 1,
                px: 2,
                borderRadius: 1,
                bgcolor: insuranceWarningConfig ? 'error.lighter' : 'grey.50',
                border: 1,
                borderColor: insuranceWarningConfig ? 'error.light' : 'divider',
              }}
            >
              {insuranceWarningConfig ? (
                <WarningAmberIcon
                  sx={{
                    fontSize: 20,
                    color: `${insuranceWarningConfig.color}.main`,
                  }}
                />
              ) : (
                <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
              )}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {carrier.insuranceExpiry
                    ? `Expires: ${carrier.insuranceExpiry}`
                    : 'No expiry date set'}
                </Typography>
                {insuranceWarningConfig && (
                  <Chip
                    label={insuranceWarningConfig.label}
                    size="small"
                    color={insuranceWarningConfig.color}
                    sx={{ mt: 0.5, height: 20, fontSize: '0.6875rem' }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Card>
  );
};
