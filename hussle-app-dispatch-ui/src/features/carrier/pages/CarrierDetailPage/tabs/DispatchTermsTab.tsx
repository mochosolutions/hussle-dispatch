import { Box, Card, Chip, Typography } from '@mui/material';
import { useSelector } from 'store';
import { EditableSectionHeader } from '../../../components/EditableSectionHeader';
import { FieldRow } from '../../../components/FieldRow';
import { selectUserRole } from '../../../store/selectors/carrierSelectors';
import type { CarrierListItem } from '../../../types';

interface DispatchTermsTabProps {
  carrier: CarrierListItem;
  onEditTerms: () => void;
}

export const DispatchTermsTab: React.FC<DispatchTermsTabProps> = ({
  carrier,
  onEditTerms,
}) => {
  const userRole = useSelector(selectUserRole);
  const isDispatcher = userRole === 'DISPATCHER' || userRole === 'dispatcher';

  return (
    <Card>
      <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <EditableSectionHeader title="Dispatch Terms" onEdit={onEditTerms} />
      </Box>
      <Box sx={{ px: 3, py: 2, maxWidth: 480 }}>
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
      </Box>
    </Card>
  );
};
