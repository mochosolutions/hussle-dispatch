import { Box, Chip, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useSelector } from 'store';
import SectionCard from 'components/SectionCard';
import { FieldRow } from '../../../components/FieldRow';
import { ONBOARDING_ITEMS } from '../../../constants';
import { selectUserRole } from '../../../store/selectors/carrierSelectors';
import type { CarrierListItem, InsuranceWarning } from '../../../types';

interface GeneralTabProps {
  carrier: CarrierListItem & {
    createdAt: string;
    updatedAt: string;
    insuranceExpiry: string | null;
  };
  onEditCompanyInfo: () => void;
  onEditTerms: () => void;
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

export const GeneralTab: React.FC<GeneralTabProps> = ({ carrier, onEditCompanyInfo, onEditTerms }) => {
  const userRole = useSelector(selectUserRole);
  const isDispatcher = userRole === 'DISPATCHER' || userRole === 'dispatcher';
  const fullAddress = [carrier.address, carrier.city, carrier.state, carrier.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Company Information */}
      <SectionCard
        title="Company Information"
        actions={
          <Tooltip title="Edit company information">
            <IconButton
              size="small"
              onClick={onEditCompanyInfo}
              sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
              aria-label="Edit company information"
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        }
      >
        <Grid container>
          <Grid item xs={6}>
            <FieldRow label="Legal Name" value={carrier.name} />
            <FieldRow label="MC Number" value={carrier.mcNumber} />
            <FieldRow label="DOT Number" value={carrier.dotNumber} />
            <FieldRow label="EIN" value={carrier.ein} />
          </Grid>
          <Grid item xs={6}>
            <FieldRow label="Phone" value={carrier.phone} />
            <FieldRow label="Email" value={carrier.email} isLink />
            <FieldRow label="Address" value={fullAddress} />
          </Grid>
        </Grid>
      </SectionCard>

      {/* Performance (read-only) */}
      <SectionCard title="Performance (All Time)">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 2,
          }}
        >
          {[
            { value: '—', label: 'Total Loads' },
            { value: '—', label: 'Revenue' },
            { value: '—', label: 'Avg Rate/Mi' },
            { value: '—', label: 'On-Time %' },
            { value: '—', label: 'Avg Days Out' },
          ].map((stat) => (
            <Box
              key={stat.label}
              sx={{
                textAlign: 'center',
                py: 1.5,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {stat.value}
              </Typography>
              <Typography variant="caption">{stat.label}</Typography>
            </Box>
          ))}
        </Box>
      </SectionCard>

      {/* Dispatch Terms */}
      <SectionCard
        title="Dispatch Terms"
        actions={
          <Tooltip title="Edit dispatch terms">
            <IconButton
              size="small"
              onClick={onEditTerms}
              sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
              aria-label="Edit dispatch terms"
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        }
      >
        <FieldRow
          label="Dispatch Fee"
          value={
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {carrier.dispatchFeePercent}%
            </Typography>
          }
        />

        {!isDispatcher && (
          <FieldRow
            label="Partner Split"
            value={
              carrier.partnerSplitPercent ? `${carrier.partnerSplitPercent}%` : '—'
            }
          />
        )}

        <FieldRow
          label="Fee Includes Accessorials"
          value={
            <Chip
              label={carrier.feeIncludesAccessorials ? 'Yes' : 'No'}
              size="small"
              color={carrier.feeIncludesAccessorials ? 'success' : 'default'}
              variant="outlined"
              sx={{ height: 22, fontSize: '0.75rem' }}
            />
          }
        />

        <FieldRow
          label="Agreement on File"
          value={
            <Chip
              label={carrier.dispatchAgreementOnFile ? 'On File' : 'Missing'}
              size="small"
              color={carrier.dispatchAgreementOnFile ? 'success' : 'warning'}
              variant="outlined"
              sx={{ height: 22, fontSize: '0.75rem' }}
            />
          }
        />
      </SectionCard>

      {/* Carrier Onboarding — only shown while onboarding is incomplete */}
      {!carrier.onboardingComplete && (() => {
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
          <SectionCard
            title="Carrier Onboarding"
            actions={
              <Chip
                label={allComplete ? 'Complete' : 'Incomplete'}
                size="small"
                color={allComplete ? 'success' : 'warning'}
                variant="outlined"
                sx={{ height: 22, fontSize: '0.75rem' }}
              />
            }
          >
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
          </SectionCard>
        );
      })()}
    </Box>
  );
};
