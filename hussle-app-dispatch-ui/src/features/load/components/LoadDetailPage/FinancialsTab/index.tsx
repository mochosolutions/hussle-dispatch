import { useState, useCallback } from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SectionCard from 'components/SectionCard';
import { DetailRow, SectionLabel } from 'components/Typography';
import { useDispatch } from 'store';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { StatusTimeline } from '../StatusTimeline';
import { formatCurrency } from '../../../constants';
import { deleteAccessorialRequest } from '../../../store/reducers';
import type { AccessorialCharge, LoadDetail } from '../../../types';

// ---------------------------------------------------------------------------
// Display labels
// ---------------------------------------------------------------------------

const ACCESSORIAL_TYPE_LABELS: Record<string, string> = {
  DETENTION: 'Detention',
  LAYOVER: 'Layover',
  LUMPER: 'Lumper',
  TARP: 'Tarp',
  TONU: 'TONU',
  DRIVER_ASSIST: 'Driver Assist',
  FUEL_SURCHARGE: 'Fuel Surcharge',
  TOLL: 'Toll',
  OTHER: 'Custom',
};

const BILL_TO_LABELS: Record<string, string> = {
  CARRIER: 'Carrier',
  CUSTOMER: 'Customer',
  BOTH: 'Both',
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DISPUTED: 'Disputed',
};

const APPROVAL_STATUS_COLORS: Record<string, 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  DISPUTED: 'error',
};

// ---------------------------------------------------------------------------
// FinancialsTab
// ---------------------------------------------------------------------------

interface FinancialsTabProps {
  load: LoadDetail;
}

export const FinancialsTab: React.FC<FinancialsTabProps> = ({ load }) => {
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const accessorialTotal = load.activity.accessorialCharges.reduce(
    (sum, charge) => sum + parseFloat(charge.amount),
    0,
  );

  const marginPercent = load.financials.marginPercent
    ? `${parseFloat(load.financials.marginPercent).toFixed(1)}%`
    : '';

  const handleAddClick = useCallback(() => {
    openDrawer('loadAccessorial', { loadId: load.id });
  }, [openDrawer, load.id]);

  const handleEditClick = useCallback(
    (charge: AccessorialCharge) => {
      openDrawer('loadAccessorial', { loadId: load.id, accessorialId: charge.id });
    },
    [openDrawer, load.id],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmId) {
      dispatch(
        deleteAccessorialRequest({ loadId: load.id, accessorialId: deleteConfirmId }),
      );
      setDeleteConfirmId(null);
    }
  }, [dispatch, load.id, deleteConfirmId]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={8}>
        <SectionCard title="Financials" contentSX={{ p: 0 }}>
          <SectionLabel sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block' }}>
            Rate Breakdown
          </SectionLabel>
          <DetailRow label="Customer Rate" value={formatCurrency(load.financials.customerRate)} />
          <DetailRow
            label="Carrier Payout"
            value={formatCurrency(load.financials.carrierPayout)}
            noBorder
          />
          <Divider />
          <DetailRow
            label={`Company Margin${marginPercent ? ` (${marginPercent})` : ''}`}
            value={formatCurrency(load.financials.companyMargin)}
          />
          <Divider />
          <DetailRow
            label="Company Net"
            value={formatCurrency(load.financials.companyNet)}
            sx={{ '& .MuiTypography-root:last-child': { fontSize: '1rem' } }}
          />
          <DetailRow
            label="Rate / Mile"
            value={
              load.financials.ratePerMile
                ? `$${parseFloat(load.financials.ratePerMile).toFixed(2)}`
                : '—'
            }
            noBorder
            sx={{ '& .MuiTypography-root:last-child': { fontSize: '1rem' } }}
          />
        </SectionCard>

        <SectionCard
          title="Accessorial Charges"
          actions={
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
            >
              Add Accessorial
            </Button>
          }
        >
          {load.activity.accessorialCharges.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Bill To</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right" sx={{ width: 80 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {load.activity.accessorialCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell>
                        {ACCESSORIAL_TYPE_LABELS[charge.type] ?? charge.type}
                        {charge.isAutoGenerated && (
                          <Chip
                            label="Auto"
                            size="small"
                            sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{charge.description ?? '—'}</TableCell>
                      <TableCell align="right">{formatCurrency(charge.amount)}</TableCell>
                      <TableCell>{BILL_TO_LABELS[charge.billTo] ?? charge.billTo}</TableCell>
                      <TableCell>
                        {charge.approvalStatus !== 'NONE' && (
                          <Chip
                            label={
                              APPROVAL_STATUS_LABELS[charge.approvalStatus] ?? charge.approvalStatus
                            }
                            size="small"
                            color={APPROVAL_STATUS_COLORS[charge.approvalStatus] ?? 'default'}
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(charge)}
                            disabled={charge.isAutoGenerated}
                            aria-label={`Edit ${charge.type} charge`}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirmId(charge.id)}
                            disabled={charge.isAutoGenerated}
                            aria-label={`Remove ${charge.type} charge`}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                      Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(accessorialTotal)}
                    </TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No accessorial charges
            </Typography>
          )}
        </SectionCard>
      </Grid>

      {/* Right — Timeline */}
      <Grid item xs={12} lg={4}>
        <SectionCard title="Status Timeline">
          <StatusTimeline history={load.activity.statusHistory ?? []} />
        </SectionCard>
      </Grid>

      {/* Delete confirmation */}
      <Dialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="xs"
      >
        <DialogTitle>Remove Accessorial Charge</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to remove this accessorial charge?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};
