import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import MainCard from 'components/MainCard';
import { PageHeader } from 'components/PageHeader';
import { PageWrapper } from 'components/PageWrapper';
import { useSelector, useDispatch } from 'store';
import {
  fetchInvoiceDetailsRequest,
  deleteInvoiceRequest,
  approveInvoiceRequest,
  sendInvoiceRequest,
} from '../store/reducers';
import {
  selectInvoiceById,
  selectInvoiceDetailLoading,
} from '../store/selectors/invoiceSelectors';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '../constants';
import { downloadInvoicePdf } from '../components/InvoicePdfTemplate/generateInvoicePdf';
import { PaymentDrawer } from '../components/PaymentDrawer';
import type { InvoiceDetail, InvoiceStatus } from '../types';
import type { InvoiceData } from '../types/invoiceTypes';

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------

const SECTION_LABEL_SX = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
  mb: 1,
} as const;

const LABEL_SX = { color: 'text.secondary', fontSize: '0.75rem' } as const;
const VALUE_SX = { fontWeight: 600, fontSize: '0.875rem' } as const;

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

// ---------------------------------------------------------------------------
// InfoRow helper
// ---------------------------------------------------------------------------

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
    <Typography sx={LABEL_SX}>{label}</Typography>
    <Typography sx={VALUE_SX}>{value ?? '\u2014'}</Typography>
  </Stack>
);

// ---------------------------------------------------------------------------
// Map InvoiceDetail to InvoiceData for PDF generation
// ---------------------------------------------------------------------------

const mapToPdfData = (invoice: InvoiceDetail): InvoiceData => ({
  invoiceNumber: invoice.invoiceNumber,
  invoiceDate: invoice.invoiceDate,
  dueDate: invoice.dueDate,
  paymentTerms: invoice.paymentTerms as InvoiceData['paymentTerms'],
  invoiceType: invoice.invoiceType,
  billTo: {
    name: invoice.billTo?.name ?? '',
    address: {
      street: invoice.billTo?.address ?? '',
      city: invoice.billTo?.city ?? '',
      state: invoice.billTo?.state ?? '',
      zip: invoice.billTo?.zip ?? '',
    },
    phone: invoice.billTo?.phone,
    email: invoice.billTo?.email,
  },
  orgSettings: {
    companyName: 'Hussle Dispatch',
    address: { street: '', city: '', state: '', zip: '' },
  },
  loadDetails: {
    loadNumber: invoice.loadNumber ?? '',
    route: '',
    pickupDate: '',
    deliveryDate: '',
  },
  lineItems: invoice.lineItems.map((li) => ({
    description: li.description,
    quantity: li.quantity,
    rate: li.rate,
    amount: li.amount,
  })),
  accessorials: invoice.accessorials.map((acc) => ({
    description: acc.description,
    amount: acc.amount,
  })),
  subtotal: invoice.subtotal,
  accessorialsTotal: invoice.accessorialsTotal,
  grandTotal: invoice.grandTotal,
  notes: invoice.notes ?? undefined,
});

// ---------------------------------------------------------------------------
// Invoice Detail Page
// ---------------------------------------------------------------------------

const InvoiceDetailPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const invoice = useSelector(
    selectInvoiceById(invoiceId ?? ''),
  ) as (InvoiceDetail & Record<string, unknown>) | undefined;
  const isLoading = useSelector(selectInvoiceDetailLoading(invoiceId ?? ''));

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      dispatch(fetchInvoiceDetailsRequest({ id: invoiceId }));
    }
  }, [dispatch, invoiceId]);

  const handleBack = useCallback(() => {
    navigate('/invoices');
  }, [navigate]);

  const handleApprove = useCallback(() => {
    if (invoiceId) {
      dispatch(approveInvoiceRequest({ id: invoiceId }));
    }
  }, [dispatch, invoiceId]);

  const handleDelete = useCallback(() => {
    if (invoiceId) {
      dispatch(deleteInvoiceRequest({ id: invoiceId }));
    }
    setDeleteDialogOpen(false);
  }, [dispatch, invoiceId]);

  const handleSendInvoice = useCallback(async () => {
    if (!invoice || !invoiceId) {
      return;
    }

    if (!invoice.recipientEmail) {
      // No recipient: download PDF manually
      const pdfData = mapToPdfData(invoice as InvoiceDetail);
      await downloadInvoicePdf(pdfData);
      return;
    }

    dispatch(sendInvoiceRequest({ id: invoiceId, recipientEmail: invoice.recipientEmail }));
  }, [dispatch, invoice, invoiceId]);

  const handleOpenPayment = useCallback(() => {
    setPaymentDrawerOpen(true);
  }, []);

  const handleClosePayment = useCallback(() => {
    setPaymentDrawerOpen(false);
  }, []);

  const isOverdue = useMemo(() => {
    if (!invoice) {
      return false;
    }
    if (invoice.status === 'PAID' || invoice.status === 'VOID') {
      return false;
    }
    return new Date(invoice.dueDate) < new Date();
  }, [invoice]);

  // ---------------------------------------------------------------------------
  // Action buttons per status
  // ---------------------------------------------------------------------------

  const renderActions = useCallback(() => {
    if (!invoice) {
      return null;
    }

    const status = invoice.status as InvoiceStatus;

    const actions: React.ReactNode[] = [
      <Button
        key="back"
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
      >
        Back
      </Button>,
      <Chip
        key="status"
        label={INVOICE_STATUS_LABELS[status]}
        variant="outlined"
        sx={{
          fontWeight: 700,
          color: INVOICE_STATUS_COLORS[status],
          borderColor: INVOICE_STATUS_COLORS[status],
        }}
      />,
    ];

    if (status === 'DRAFT') {
      actions.push(
        <Button key="approve" variant="contained" onClick={handleApprove}>
          Approve
        </Button>,
        <Button
          key="delete"
          variant="outlined"
          color="error"
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete
        </Button>,
      );
    }

    if (status === 'APPROVED') {
      actions.push(
        <Button key="send" variant="contained" onClick={handleSendInvoice}>
          {invoice.recipientEmail ? 'Generate PDF & Send' : 'Download PDF'}
        </Button>,
      );
    }

    if (status === 'SENT' || status === 'PARTIALLY_PAID') {
      actions.push(
        <Button key="markPaid" variant="contained" onClick={handleOpenPayment}>
          Mark Paid
        </Button>,
      );
    }

    return (
      <Stack direction="row" spacing={1} alignItems="center">
        {actions}
      </Stack>
    );
  }, [invoice, handleBack, handleApprove, handleSendInvoice, handleOpenPayment]);

  // ---------------------------------------------------------------------------
  // Not found state
  // ---------------------------------------------------------------------------

  if (!invoice && !isLoading) {
    return (
      <PageWrapper errorContext="InvoiceDetailPage">
        <PageHeader
          title="Invoice Not Found"
          headerActions={
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
              Back
            </Button>
          }
        />
        <MainCard>
          <Typography variant="body1" color="text.secondary">
            The requested invoice could not be found.
          </Typography>
        </MainCard>
      </PageWrapper>
    );
  }

  const invoiceDetail = invoice as InvoiceDetail | undefined;

  return (
    <PageWrapper isLoading={isLoading} errorContext="InvoiceDetailPage">
      {invoiceDetail && (
        <>
          <PageHeader
            title={invoiceDetail.invoiceNumber}
            headerActions={renderActions()}
          />

          {/* Missing BOL warning */}
          {invoiceDetail.missingBol && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Bill of Lading (BOL) is missing for this invoice. Please upload the BOL before
              sending.
            </Alert>
          )}

          {/* Overdue warning */}
          {isOverdue && (
            <Alert severity="error" sx={{ mb: 2 }}>
              This invoice is overdue. Due date was{' '}
              {format(new Date(invoiceDetail.dueDate), 'MMM dd, yyyy')}.
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Left Column */}
            <Grid item xs={12} lg={8}>
              {/* Invoice Info */}
              <MainCard sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                  Invoice Info
                </Typography>
                <InfoRow label="Invoice Number" value={invoiceDetail.invoiceNumber} />
                <InfoRow label="Type" value={invoiceDetail.invoiceType} />
                <InfoRow
                  label="Invoice Date"
                  value={
                    invoiceDetail.invoiceDate
                      ? format(new Date(invoiceDetail.invoiceDate), 'MMM dd, yyyy')
                      : null
                  }
                />
                <InfoRow
                  label="Due Date"
                  value={
                    invoiceDetail.dueDate
                      ? format(new Date(invoiceDetail.dueDate), 'MMM dd, yyyy')
                      : null
                  }
                />
                <InfoRow label="Payment Terms" value={invoiceDetail.paymentTerms} />
              </MainCard>

              {/* Bill To */}
              <MainCard sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                  Bill To
                </Typography>
                {invoiceDetail.billTo ? (
                  <>
                    <InfoRow label="Name" value={invoiceDetail.billTo.name} />
                    <InfoRow label="Address" value={invoiceDetail.billTo.address} />
                    <InfoRow
                      label="City/State/Zip"
                      value={`${invoiceDetail.billTo.city}, ${invoiceDetail.billTo.state} ${invoiceDetail.billTo.zip}`}
                    />
                    <InfoRow label="Phone" value={invoiceDetail.billTo.phone} />
                    <InfoRow label="Email" value={invoiceDetail.billTo.email} />
                  </>
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    No billing information
                  </Typography>
                )}
              </MainCard>

              {/* Load Reference */}
              {invoiceDetail.loadNumber && (
                <MainCard sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                    Load Reference
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={LABEL_SX}>Load Number</Typography>
                    <Typography
                      component={RouterLink}
                      to={`/loads/${invoiceDetail.loadId}`}
                      sx={{ ...VALUE_SX, color: 'primary.main', textDecoration: 'none' }}
                    >
                      {invoiceDetail.loadNumber}
                    </Typography>
                  </Stack>
                </MainCard>
              )}

              {/* Line Items */}
              <MainCard sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                  Line Items
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceDetail.lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{currencyFormatter.format(item.rate)}</TableCell>
                        <TableCell align="right">
                          {currencyFormatter.format(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </MainCard>

              {/* Accessorials */}
              {invoiceDetail.accessorials.length > 0 && (
                <MainCard sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                    Accessorials
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoiceDetail.accessorials.map((acc) => (
                        <TableRow key={acc.id}>
                          <TableCell>{acc.description}</TableCell>
                          <TableCell align="right">
                            {currencyFormatter.format(acc.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </MainCard>
              )}
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} lg={4}>
              {/* Totals */}
              <MainCard sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                  Totals
                </Typography>
                <InfoRow
                  label="Subtotal"
                  value={currencyFormatter.format(invoiceDetail.subtotal)}
                />
                <InfoRow
                  label="Accessorials"
                  value={currencyFormatter.format(invoiceDetail.accessorialsTotal)}
                />
                <Divider sx={{ my: 1 }} />
                <InfoRow
                  label="Grand Total"
                  value={currencyFormatter.format(invoiceDetail.grandTotal)}
                />
                {invoiceDetail.paidAmount > 0 && (
                  <>
                    <InfoRow
                      label="Paid"
                      value={currencyFormatter.format(invoiceDetail.paidAmount)}
                    />
                    <InfoRow
                      label="Balance Due"
                      value={currencyFormatter.format(
                        invoiceDetail.grandTotal - invoiceDetail.paidAmount,
                      )}
                    />
                  </>
                )}
              </MainCard>

              {/* Payment History */}
              {invoiceDetail.payments.length > 0 && (
                <MainCard sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                    Payment History
                  </Typography>
                  <Stack spacing={1}>
                    {invoiceDetail.payments.map((payment) => (
                      <Box
                        key={payment.id}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1.5,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {currencyFormatter.format(payment.amount)}
                          </Typography>
                          <Chip
                            label={payment.method}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.6875rem' }}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(payment.paidAt), 'MMM dd, yyyy')}
                        </Typography>
                        {payment.reference && (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ display: 'block' }}
                          >
                            Ref: {payment.reference}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </MainCard>
              )}

              {/* Notes */}
              {invoiceDetail.notes && (
                <MainCard sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                    Notes
                  </Typography>
                  <Typography variant="body2">{invoiceDetail.notes}</Typography>
                </MainCard>
              )}
            </Grid>
          </Grid>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete invoice {invoiceDetail.invoiceNumber}? This action
                cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleDelete} color="error" variant="contained">
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Payment Drawer */}
          {paymentDrawerOpen && (
            <PaymentDrawer
              invoiceId={invoiceDetail.id}
              balanceDue={invoiceDetail.grandTotal - invoiceDetail.paidAmount}
              onClose={handleClosePayment}
            />
          )}
        </>
      )}
    </PageWrapper>
  );
};

export default InvoiceDetailPage;
