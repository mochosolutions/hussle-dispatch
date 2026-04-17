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
  Stack,
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
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextField, SelectField } from '@mocho/ui/components';
import SectionCard from 'components/SectionCard';
import { DetailRow, SectionLabel } from 'components/Typography';
import { useDispatch } from 'store';
import { StatusTimeline } from '../StatusTimeline';
import { formatCurrency } from '../../../constants';
import {
  createAccessorialRequest,
  updateAccessorialRequest,
  deleteAccessorialRequest,
} from '../../../store/reducers';
import type { AccessorialCharge, LoadDetail } from '../../../types';

// ---------------------------------------------------------------------------
// Accessorial form schema
// ---------------------------------------------------------------------------

const ACCESSORIAL_TYPE_OPTIONS = [
  { value: 'DETENTION', label: 'Detention' },
  { value: 'LAYOVER', label: 'Layover' },
  { value: 'LUMPER', label: 'Lumper' },
  { value: 'TARP', label: 'Tarp' },
  { value: 'TONU', label: 'TONU' },
  { value: 'DRIVER_ASSIST', label: 'Driver Assist' },
  { value: 'FUEL_SURCHARGE', label: 'Fuel Surcharge' },
  { value: 'TOLL', label: 'Toll' },
  { value: 'OTHER', label: 'Other' },
];

const BILL_TO_OPTIONS = [
  { value: 'CARRIER', label: 'Carrier' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'BOTH', label: 'Both' },
];

const ACCESSORIAL_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ACCESSORIAL_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);

const BILL_TO_LABELS: Record<string, string> = Object.fromEntries(
  BILL_TO_OPTIONS.map(({ value, label }) => [value, label]),
);

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

const accessorialSchema = Yup.object({
  type: Yup.string().required('Type is required'),
  description: Yup.string().default(''),
  amount: Yup.number().min(0, 'Amount must be positive').required('Amount is required'),
  billTo: Yup.string().oneOf(['CARRIER', 'CUSTOMER', 'BOTH']).required('Bill to is required'),
}).required();

type AccessorialFormValues = Yup.InferType<typeof accessorialSchema>;

// ---------------------------------------------------------------------------
// Accessorial Dialog
// ---------------------------------------------------------------------------

interface AccessorialDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AccessorialFormValues) => void;
  initialValues?: AccessorialFormValues;
  title: string;
}

const AccessorialDialog: React.FC<AccessorialDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  title,
}) => {
  const defaults: AccessorialFormValues = initialValues ?? {
    type: '',
    description: '',
    amount: 0,
    billTo: 'BOTH',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <Formik
        initialValues={defaults}
        validationSchema={accessorialSchema}
        onSubmit={(values) => {
          onSubmit(values);
          onClose();
        }}
        enableReinitialize
      >
        {(formik) => (
          <Form>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 0.5 }}>
                <SelectField
                  name="type"
                  label="Type"
                  data={ACCESSORIAL_TYPE_OPTIONS}
                  formik={formik}
                  required
                />
                <TextField name="description" label="Description" formik={formik} />
                <TextField name="amount" label="Amount ($)" formik={formik} required />
                <SelectField
                  name="billTo"
                  label="Bill To"
                  data={BILL_TO_OPTIONS}
                  formik={formik}
                  required
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!formik.isValid || formik.isSubmitting}
              >
                {initialValues ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// FinancialsTab
// ---------------------------------------------------------------------------

interface FinancialsTabProps {
  load: LoadDetail;
}

export const FinancialsTab: React.FC<FinancialsTabProps> = ({ load }) => {
  const dispatch = useDispatch();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<AccessorialCharge | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const accessorialTotal = load.activity.accessorialCharges.reduce(
    (sum, charge) => sum + parseFloat(charge.amount),
    0,
  );

  const marginPercent = load.financials.marginPercent
    ? `${parseFloat(load.financials.marginPercent).toFixed(1)}%`
    : '';

  const handleAddClick = useCallback(() => {
    setEditingCharge(null);
    setDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((charge: AccessorialCharge) => {
    setEditingCharge(charge);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditingCharge(null);
  }, []);

  const handleDialogSubmit = useCallback(
    (values: AccessorialFormValues) => {
      if (editingCharge) {
        dispatch(
          updateAccessorialRequest({
            loadId: load.id,
            accessorialId: editingCharge.id,
            data: values,
          }),
        );
      } else {
        dispatch(createAccessorialRequest({ loadId: load.id, data: values }));
      }
    },
    [dispatch, load.id, editingCharge],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmId) {
      dispatch(deleteAccessorialRequest({ loadId: load.id, accessorialId: deleteConfirmId }));
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
                : '\u2014'
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
              Add
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
                      <TableCell>{charge.description ?? '\u2014'}</TableCell>
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
                          <IconButton size="small" onClick={() => handleEditClick(charge)}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirmId(charge.id)}
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

      {/* Accessorial add/edit dialog */}
      <AccessorialDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        title={editingCharge ? 'Edit Accessorial Charge' : 'Add Accessorial Charge'}
        initialValues={
          editingCharge
            ? {
                type: editingCharge.type,
                description: editingCharge.description ?? '',
                amount: parseFloat(editingCharge.amount),
                billTo: editingCharge.billTo,
              }
            : undefined
        }
      />

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
