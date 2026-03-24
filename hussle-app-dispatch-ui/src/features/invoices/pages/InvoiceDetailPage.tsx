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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import SectionCard from 'components/SectionCard';
import { KpiCell, DetailRow, SectionLabel, LinkText, Body, BodyMuted } from 'components/Typography';
import { useSelector, useDispatch } from 'store';
import {
  fetchInvoiceDetailsRequest,
  deleteInvoiceRequest,
  approveInvoiceRequest,
  sendInvoiceRequest,
  voidInvoiceRequest,
  downloadPacketRequest,
  previewPdfRequest,
  markPaidRequest,
} from '../store/reducers';
import {
  selectInvoiceById,
  selectInvoiceDetailLoading,
} from '../store/selectors/invoiceSelectors';
import type { InvoiceDetail, InvoiceStatus } from '../types';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const INVOICE_DETAIL_TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Documents', value: 'documents' },
  { label: 'Activity', value: 'activity' },
] as const;

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

// ---------------------------------------------------------------------------
// Invoice Detail Page
// ---------------------------------------------------------------------------

const InvoiceDetailPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const rawInvoice = useSelector(selectInvoiceById(invoiceId ?? ''));
  const isDetailLoading = useSelector(selectInvoiceDetailLoading(invoiceId ?? ''));

  // Track whether the detail fetch for this invoiceId has completed at least once.
  const [fetchedId, setFetchedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (invoiceId) {
      setFetchedId(null);
      dispatch(fetchInvoiceDetailsRequest({ id: invoiceId }));
    }
  }, [dispatch, invoiceId]);

  useEffect(() => {
    if (!isDetailLoading && invoiceId && fetchedId !== invoiceId) {
      setFetchedId(invoiceId);
    }
  }, [isDetailLoading, invoiceId, fetchedId]);

  const detailReady = fetchedId === invoiceId;
  const hasDetailShape = rawInvoice !== undefined && 'accessorialItems' in rawInvoice;
  const invoice = detailReady && hasDetailShape ? (rawInvoice as InvoiceDetail) : undefined;
  const isLoading = !detailReady;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);

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

  const handleVoid = useCallback(() => {
    if (invoiceId) {
      dispatch(voidInvoiceRequest({ id: invoiceId }));
    }
  }, [dispatch, invoiceId]);

  const handleSendInvoice = useCallback(() => {
    if (!invoiceId || !sendEmail) {
      return;
    }
    dispatch(sendInvoiceRequest({ id: invoiceId, recipientEmail: sendEmail }));
    setSendDialogOpen(false);
  }, [dispatch, invoiceId, sendEmail]);

  const handleOpenSend = useCallback(() => {
    setSendEmail(invoice?.sentToEmail ?? invoice?.sentTo ?? '');
    setSendDialogOpen(true);
  }, [invoice]);

  const handleMarkPaid = useCallback(() => {
    if (!invoiceId || !invoice) {
      return;
    }
    dispatch(
      markPaidRequest({
        id: invoiceId,
        payment: {
          amount: Number(invoice.totalAmount) - Number(invoice.paidAmount ?? '0'),
          method: 'ACH',
          paidAt: new Date().toISOString(),
        },
      }),
    );
    setMarkPaidDialogOpen(false);
  }, [dispatch, invoiceId, invoice]);

  const handlePreviewPdf = useCallback(() => {
    if (invoiceId) {
      dispatch(previewPdfRequest({ id: invoiceId }));
    }
  }, [dispatch, invoiceId]);

  const handleDownloadPacket = useCallback(() => {
    if (invoiceId) {
      dispatch(downloadPacketRequest({ id: invoiceId }));
    }
  }, [dispatch, invoiceId]);

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
  // Action buttons (status-dependent)
  // ---------------------------------------------------------------------------

  const renderActions = useCallback(
    (inv: InvoiceDetail) => {
      const status = inv.status as InvoiceStatus;
      const buttons: React.ReactNode[] = [
        <Button key="preview" variant="outlined" size="small" onClick={handlePreviewPdf}>
          Preview PDF
        </Button>,
        <Button key="packet" variant="outlined" size="small" onClick={handleDownloadPacket}>
          Download Packet
        </Button>,
      ];

      if (status === 'DRAFT') {
        buttons.push(
          <Button key="approve" variant="contained" size="small" onClick={handleApprove}>
            Approve
          </Button>,
          <Button key="void" variant="outlined" size="small" color="warning" onClick={handleVoid}>
            Void
          </Button>,
        );
      }

      if (status === 'APPROVED') {
        buttons.push(
          <Button key="send" variant="contained" size="small" onClick={handleOpenSend}>
            Send Invoice
          </Button>,
          <Button key="void" variant="outlined" size="small" color="warning" onClick={handleVoid}>
            Void
          </Button>,
        );
      }

      if (status === 'SENT' || status === 'PARTIALLY_PAID') {
        buttons.push(
          <Button
            key="markPaid"
            variant="contained"
            size="small"
            onClick={() => setMarkPaidDialogOpen(true)}
          >
            Mark Paid
          </Button>,
        );
      }

      return <>{buttons}</>;
    },
    [handlePreviewPdf, handleDownloadPacket, handleApprove, handleVoid, handleOpenSend],
  );

  // ---------------------------------------------------------------------------
  // Summary KPI cells
  // ---------------------------------------------------------------------------

  const renderSummary = useCallback(
    (inv: InvoiceDetail) => {
      const carrierName = inv.carrier?.name ?? '\u2014';
      const loadNumber = inv.load?.loadNumber ?? '\u2014';
      const dueDate = inv.dueDate ? format(new Date(inv.dueDate), 'MMM dd, yyyy') : '\u2014';
      const termsSub = inv.paymentTerms ?? undefined;
      const grandTotal = currencyFormatter.format(Number(inv.totalAmount ?? '0'));
      const billingMethod = inv.billingMethod ?? '\u2014';
      const hasBol = !inv.missingSignedBol;

      return (
        <>
          <KpiCell
            label="Carrier / Broker"
            value={
              inv.carrier ? (
                <Typography
                  component={RouterLink}
                  to={`/carriers/${inv.carrier.id}`}
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {carrierName}
                </Typography>
              ) : (
                '\u2014'
              )
            }
          />
          <KpiCell
            label="Load #"
            value={
              inv.load ? (
                <Typography
                  component={RouterLink}
                  to={`/loads/${inv.load.id}`}
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {loadNumber}
                </Typography>
              ) : (
                '\u2014'
              )
            }
          />
          <KpiCell label="Due Date" value={dueDate} sub={termsSub} />
          <KpiCell
            label="Grand Total"
            value={grandTotal}
            valueProps={{ color: 'success.main' }}
          />
          <KpiCell label="Billing Method" value={billingMethod} />
          <KpiCell
            label="BOL Status"
            value={hasBol ? 'Present' : 'Missing'}
            valueProps={{ color: hasBol ? 'success.main' : 'error.main' }}
          />
        </>
      );
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Derived values for totals
  // ---------------------------------------------------------------------------

  const subtotalNum = Number(invoice?.subtotal ?? '0');
  const accessorialsNum = Number(invoice?.accessorials ?? '0');
  const totalAmountNum = Number(invoice?.totalAmount ?? '0');
  const paidAmount = Number(invoice?.paidAmount ?? '0');

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PageWrapper isLoading={isLoading} errorContext="InvoiceDetailPage">
      <DataGuard
        data={invoice}
        emptyComponent={<Typography p={4}>Invoice not found.</Typography>}
      >
        {(inv) => (
          <>
            <DetailLayout
              id={inv.invoiceNumber}
              status={inv.status}
              breadcrumb={{ label: 'Invoices', href: '/invoices' }}
              onBack={handleBack}
              actions={renderActions(inv)}
              summary={renderSummary(inv)}
              tabs={INVOICE_DETAIL_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            >
              {/* Alerts */}
              {inv.missingSignedBol && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  Signed Bill of Lading (BOL) was missing at time of invoice generation.
                </Alert>
              )}
              {isOverdue && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  This invoice is overdue. Due date was{' '}
                  {format(new Date(inv.dueDate), 'MMM dd, yyyy')}.
                </Alert>
              )}

              {/* Overview tab */}
              {activeTab === 'overview' && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 320px' },
                    gap: 3,
                  }}
                >
                  {/* Left column */}
                  <Stack spacing={3}>
                    {/* Invoice Information */}
                    <SectionCard title="Invoice Information">
                      <DetailRow label="Invoice Number" value={inv.invoiceNumber} />
                      <DetailRow label="Type" value={inv.type} />
                      <DetailRow
                        label="Created"
                        value={format(new Date(inv.createdAt), 'MMM dd, yyyy')}
                      />
                      <DetailRow
                        label="Due Date"
                        value={format(new Date(inv.dueDate), 'MMM dd, yyyy')}
                      />
                      <DetailRow label="Payment Terms" value={inv.paymentTerms} />
                      {inv.billingMethod && (
                        <DetailRow label="Billing Method" value={inv.billingMethod} />
                      )}
                      {inv.deliveryMethod && (
                        <DetailRow label="Delivery Method" value={inv.deliveryMethod} />
                      )}
                      {inv.sentToEmail && (
                        <DetailRow label="Sent To" value={inv.sentToEmail} noBorder />
                      )}
                    </SectionCard>

                    {/* Load Reference */}
                    <SectionCard title="Load Reference">
                      {inv.load ? (
                        <>
                          <DetailRow
                            label="Load Number"
                            value={
                              <Typography
                                component={RouterLink}
                                to={`/loads/${inv.load.id}`}
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: 'primary.main',
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' },
                                }}
                              >
                                {inv.load.loadNumber}
                              </Typography>
                            }
                          />
                          <DetailRow label="Load Status" value={inv.load.status} />
                          <DetailRow label="Pickup Date" value={'\u2014'} />
                          <DetailRow label="Delivery Date" value={'\u2014'} />
                          <DetailRow label="Route" value={'\u2014'} noBorder />
                        </>
                      ) : (
                        <BodyMuted sx={{ p: 2 }}>No load associated.</BodyMuted>
                      )}
                    </SectionCard>

                    {/* Carrier */}
                    <SectionCard title="Carrier">
                      {inv.carrier ? (
                        <DetailRow label="Name" value={inv.carrier.name} noBorder />
                      ) : (
                        <BodyMuted sx={{ p: 2 }}>No carrier associated.</BodyMuted>
                      )}
                    </SectionCard>

                    {/* Accessorials */}
                    {(inv.accessorialItems?.length ?? 0) > 0 && (
                      <SectionCard title="Accessorials">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Description</TableCell>
                              <TableCell align="right">Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(inv.accessorialItems ?? []).map((acc) => (
                              <TableRow key={acc.id}>
                                <TableCell>{acc.description ?? acc.id}</TableCell>
                                <TableCell align="right">
                                  {currencyFormatter.format(Number(acc.amount))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </SectionCard>
                    )}
                  </Stack>

                  {/* Right column */}
                  <Stack spacing={3}>
                    {/* Totals */}
                    <SectionCard title="Totals">
                      <DetailRow
                        label="Subtotal"
                        value={currencyFormatter.format(subtotalNum)}
                      />
                      <DetailRow
                        label="Accessorials"
                        value={currencyFormatter.format(accessorialsNum)}
                      />
                      <DetailRow
                        label="Grand Total"
                        value={currencyFormatter.format(totalAmountNum)}
                        valueColor="success.main"
                        sx={{ bgcolor: 'grey.50', fontWeight: 700 }}
                        noBorder={paidAmount === 0}
                      />
                      {paidAmount > 0 && (
                        <>
                          <DetailRow
                            label="Paid"
                            value={currencyFormatter.format(paidAmount)}
                          />
                          <DetailRow
                            label="Balance Due"
                            value={currencyFormatter.format(totalAmountNum - paidAmount)}
                            noBorder
                          />
                        </>
                      )}
                    </SectionCard>

                    {/* Document Checklist */}
                    <SectionCard title="Document Checklist">
                      <Stack spacing={1.5} sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Body>Rate Confirmation</Body>
                          <Chip label="Present" size="small" color="success" variant="outlined" />
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Body>Bill of Lading (BOL)</Body>
                          {inv.missingSignedBol ? (
                            <Chip label="Missing" size="small" color="error" variant="outlined" />
                          ) : (
                            <Chip label="Present" size="small" color="success" variant="outlined" />
                          )}
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Body>Proof of Delivery (POD)</Body>
                          <Chip label="\u2014" size="small" variant="outlined" />
                        </Stack>
                      </Stack>
                    </SectionCard>

                    {/* Notes */}
                    <SectionCard title="Notes">
                      {inv.notes ? (
                        <Body sx={{ p: 2 }}>{inv.notes}</Body>
                      ) : (
                        <BodyMuted sx={{ p: 2 }}>No notes.</BodyMuted>
                      )}
                    </SectionCard>
                  </Stack>
                </Box>
              )}

              {/* Documents tab */}
              {activeTab === 'documents' && (
                <SectionCard title="Documents">
                  {inv.pdfUrl ? (
                    <Stack spacing={1} sx={{ p: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        href={inv.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View PDF
                      </Button>
                    </Stack>
                  ) : (
                    <BodyMuted sx={{ p: 2 }}>No documents available.</BodyMuted>
                  )}
                </SectionCard>
              )}

              {/* Activity tab */}
              {activeTab === 'activity' && (
                <SectionCard title="Activity">
                  <BodyMuted sx={{ p: 2 }}>No activity recorded yet.</BodyMuted>
                </SectionCard>
              )}
            </DetailLayout>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
              <DialogTitle>Delete Invoice</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to delete invoice {inv.invoiceNumber}? This action cannot
                  be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleDelete} color="error" variant="contained">
                  Delete
                </Button>
              </DialogActions>
            </Dialog>

            {/* Send Invoice Dialog */}
            <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)}>
              <DialogTitle>Send Invoice</DialogTitle>
              <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                  This will generate a PDF with all load documents and send it to the recipient.
                </DialogContentText>
                <TextField
                  autoFocus
                  fullWidth
                  label="Recipient Email"
                  type="email"
                  value={sendEmail}
                  onChange={(e) => setSendEmail(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleSendInvoice}
                  variant="contained"
                  disabled={!sendEmail}
                >
                  Send
                </Button>
              </DialogActions>
            </Dialog>

            {/* Mark Paid Dialog */}
            <Dialog open={markPaidDialogOpen} onClose={() => setMarkPaidDialogOpen(false)}>
              <DialogTitle>Mark Invoice as Paid</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  This will record full payment of{' '}
                  {currencyFormatter.format(totalAmountNum - paidAmount)} for invoice{' '}
                  {inv.invoiceNumber}. Are you sure?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setMarkPaidDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleMarkPaid} variant="contained" color="success">
                  Confirm Payment
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default InvoiceDetailPage;
