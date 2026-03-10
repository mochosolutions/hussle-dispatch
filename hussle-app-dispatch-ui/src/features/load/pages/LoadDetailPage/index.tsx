import { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  TextField,
  Menu,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import MainCard from 'components/MainCard';
import { PageHeader } from 'components/PageHeader';
import { PageWrapper } from 'components/PageWrapper';
import { useSelector, useDispatch } from 'store';
import {
  fetchLoadDetailsRequest,
  createCheckCallRequest,
} from '../../store/reducers';
import {
  selectLoadById,
  selectLoadDetailLoading,
} from '../../store/selectors/loadSelectors';
import { STATUS_LABELS, STATUS_COLORS } from '../../constants';
import { StatusChangeDialog } from '../../components/StatusChangeDialog';
import { LoadRouteDrawer } from '../../components/LoadRouteDrawer';
import { LoadCargoDrawer } from '../../components/LoadCargoDrawer';
import { LoadAssignmentDrawer } from '../../components/LoadAssignmentDrawer';
import { PlannedBackhaulPanel } from '../../components/PlannedBackhaulPanel';
import { DocumentList } from '../../../documents/components/DocumentList';
import { BolWorkflow } from '../../../documents/components/BolWorkflow';
import { RateConStatus } from '../../../documents/components/RateConStatus';
import type { LoadDetail, LoadStatus, CheckCallSummary, StatusHistoryEntry } from '../../types';

// ---------------------------------------------------------------------------
// Status transition mapping (happy path + alternatives)
// ---------------------------------------------------------------------------

const NEXT_STATUS: Partial<Record<LoadStatus, LoadStatus>> = {
  QUOTED: 'BOOKED',
  BOOKED: 'DISPATCHED',
  DISPATCHED: 'EN_ROUTE_PICKUP',
  EN_ROUTE_PICKUP: 'AT_PICKUP',
  AT_PICKUP: 'IN_TRANSIT',
  IN_TRANSIT: 'AT_DELIVERY',
  AT_DELIVERY: 'DELIVERED',
  DELIVERED: 'INVOICE_PENDING',
  INVOICE_PENDING: 'INVOICED',
  INVOICED: 'PAID',
};

const ALTERNATIVE_STATUSES: Partial<Record<LoadStatus, LoadStatus[]>> = {
  QUOTED: ['CANCELED'],
  BOOKED: ['CANCELED', 'TONU'],
  DISPATCHED: ['EXCEPTION', 'CANCELED', 'TONU'],
  EN_ROUTE_PICKUP: ['EXCEPTION', 'TONU'],
  AT_PICKUP: ['EXCEPTION'],
  IN_TRANSIT: ['EXCEPTION'],
  AT_DELIVERY: ['EXCEPTION'],
  DELIVERED: ['EXCEPTION'],
};

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
// Info row helper
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
// Status Timeline
// ---------------------------------------------------------------------------

const StatusTimeline: React.FC<{ history: StatusHistoryEntry[] }> = ({ history }) => (
  <Stack spacing={1}>
    {history.map((entry) => (
      <Box
        key={entry.id}
        sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            mt: 0.75,
            flexShrink: 0,
          }}
        />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {entry.fromStatus
              ? `${STATUS_LABELS[entry.fromStatus as LoadStatus] ?? entry.fromStatus} -> ${STATUS_LABELS[entry.toStatus as LoadStatus] ?? entry.toStatus}`
              : STATUS_LABELS[entry.toStatus as LoadStatus] ?? entry.toStatus}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(entry.createdAt).toLocaleString()}
            {entry.changedByName ? ` by ${entry.changedByName}` : ''}
          </Typography>
          {entry.notes && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
              {entry.notes}
            </Typography>
          )}
        </Box>
      </Box>
    ))}
    {history.length === 0 && (
      <Typography variant="caption" color="text.disabled">
        No status history yet
      </Typography>
    )}
  </Stack>
);

// ---------------------------------------------------------------------------
// Check Calls Section
// ---------------------------------------------------------------------------

interface CheckCallsSectionProps {
  checkCalls: CheckCallSummary[];
  loadId: string;
}

const CheckCallsSection: React.FC<CheckCallsSectionProps> = ({ checkCalls, loadId }) => {
  const dispatch = useDispatch();
  const [newCallNotes, setNewCallNotes] = useState('');
  const [newCallLocation, setNewCallLocation] = useState('');

  const handleAddCheckCall = useCallback(() => {
    if (!newCallNotes.trim() && !newCallLocation.trim()) {
      return;
    }

    dispatch(
      createCheckCallRequest({
        loadId,
        data: {
          location: newCallLocation.trim() || undefined,
          notes: newCallNotes.trim() || undefined,
          brokerNotified: false,
        },
      }),
    );
    setNewCallNotes('');
    setNewCallLocation('');
  }, [dispatch, loadId, newCallNotes, newCallLocation]);

  return (
    <Stack spacing={1.5}>
      {checkCalls.map((call) => (
        <Box
          key={call.id}
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {new Date(call.createdAt).toLocaleString()}
            </Typography>
            {call.status && (
              <Chip label={call.status} size="small" variant="outlined" sx={{ height: 20 }} />
            )}
          </Stack>
          {call.location && (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {call.location}
            </Typography>
          )}
          {call.notes && (
            <Typography variant="caption" color="text.secondary">
              {call.notes}
            </Typography>
          )}
        </Box>
      ))}
      {checkCalls.length === 0 && (
        <Typography variant="caption" color="text.disabled">
          No check calls yet
        </Typography>
      )}

      <Divider />
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        Add Check Call
      </Typography>
      <TextField
        size="small"
        label="Location"
        value={newCallLocation}
        onChange={(e) => setNewCallLocation(e.target.value)}
        fullWidth
      />
      <TextField
        size="small"
        label="Notes"
        value={newCallNotes}
        onChange={(e) => setNewCallNotes(e.target.value)}
        multiline
        rows={2}
        fullWidth
      />
      <Button
        variant="outlined"
        size="small"
        onClick={handleAddCheckCall}
        disabled={!newCallNotes.trim() && !newCallLocation.trim()}
      >
        Add Check Call
      </Button>
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Load Detail Page
// ---------------------------------------------------------------------------

const LoadDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // The entity store holds LoadListItem by default, but the detail saga replaces
  // it with the full LoadDetail shape. We read it as LoadDetail since we dispatch
  // fetchLoadDetailsRequest on mount which populates the full entity.
  const load = useSelector(selectLoadById(id ?? '')) as (LoadDetail & Record<string, unknown>) | undefined;
  const isLoading = useSelector(selectLoadDetailLoading(id ?? ''));

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusDialogTarget, setStatusDialogTarget] = useState<LoadStatus | null>(null);
  const [alternativesAnchor, setAlternativesAnchor] = useState<null | HTMLElement>(null);
  const [activeDrawer, setActiveDrawer] = useState<'route' | 'cargo' | 'assignment' | null>(null);

  // Show rate con upload prompt after load creation (from query param).
  // Initialize from the URL param; the param is harmless if it stays.
  const [showRateConPrompt, setShowRateConPrompt] = useState(
    () => searchParams.get('showRateConPrompt') === 'true',
  );

  const handleDismissRateConPrompt = useCallback(() => {
    setShowRateConPrompt(false);
  }, []);

  useEffect(() => {
    if (id) {
      dispatch(fetchLoadDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  const nextStatus = load ? NEXT_STATUS[load.status] : undefined;
  const altStatuses = load ? ALTERNATIVE_STATUSES[load.status] ?? [] : [];

  const handlePrimaryAction = useCallback(() => {
    if (nextStatus) {
      setStatusDialogTarget(nextStatus);
      setStatusDialogOpen(true);
    }
  }, [nextStatus]);

  const handleAlternativeClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAlternativesAnchor(event.currentTarget);
    },
    [],
  );

  const handleAlternativeSelect = useCallback(
    (status: LoadStatus) => {
      setAlternativesAnchor(null);
      setStatusDialogTarget(status);
      setStatusDialogOpen(true);
    },
    [],
  );

  const handleCloseMenu = useCallback(() => {
    setAlternativesAnchor(null);
  }, []);

  const handleCloseStatusDialog = useCallback(() => {
    setStatusDialogOpen(false);
    setStatusDialogTarget(null);
  }, []);

  const handleBack = useCallback(() => {
    navigate('/loads');
  }, [navigate]);

  const handleCloseDrawer = useCallback(() => {
    setActiveDrawer(null);
  }, []);

  if (!load && !isLoading) {
    return (
      <PageWrapper errorContext="LoadDetailPage">
        <PageHeader
          title="Load Not Found"
          headerActions={
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
              Back
            </Button>
          }
        />
        <MainCard>
          <Typography variant="body1" color="text.secondary">
            The requested load could not be found.
          </Typography>
        </MainCard>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper isLoading={isLoading} errorContext="LoadDetailPage">
      {load && (
        <>
          <PageHeader
            title={load.loadNumber}
            headerActions={
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="text"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Chip
                  label={STATUS_LABELS[load.status]}
                  sx={{
                    fontWeight: 700,
                    color: STATUS_COLORS[load.status],
                    borderColor: STATUS_COLORS[load.status],
                  }}
                  variant="outlined"
                />
                {nextStatus && (
                  <Button variant="contained" onClick={handlePrimaryAction}>
                    {STATUS_LABELS[nextStatus]}
                  </Button>
                )}
                {altStatuses.length > 0 && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleAlternativeClick}
                      endIcon={<ArrowDropDownIcon />}
                    >
                      More
                    </Button>
                    <Menu
                      anchorEl={alternativesAnchor}
                      open={Boolean(alternativesAnchor)}
                      onClose={handleCloseMenu}
                    >
                      {altStatuses.map((status) => (
                        <MenuItem key={status} onClick={() => handleAlternativeSelect(status)}>
                          {STATUS_LABELS[status]}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                )}
              </Stack>
            }
          />

          {showRateConPrompt && !load.rateConReceivedAt && (
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleDismissRateConPrompt}
                >
                  Dismiss
                </Button>
              }
            >
              Upload the broker rate confirmation now? Scroll down to the Rate Confirmation section below.
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Left Column */}
            <Grid item xs={12} lg={8}>
              {/* Route Section */}
              <MainCard sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                    Route
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<EditIcon fontSize="small" />}
                    onClick={() => setActiveDrawer('route')}
                  >
                    Edit
                  </Button>
                </Stack>
                <Stack spacing={1}>
                  {load.stops
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((stop) => (
                      <Box
                        key={stop.id}
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          alignItems: 'flex-start',
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1.5,
                        }}
                      >
                        <Chip
                          label={stop.type === 'PICKUP' ? 'P' : 'D'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: stop.type === 'PICKUP' ? 'primary.main' : 'success.main',
                            color: '#fff',
                            width: 24,
                            height: 24,
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          {stop.facilityName && (
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {stop.facilityName}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {[stop.address, stop.city, stop.state, stop.zip]
                              .filter(Boolean)
                              .join(', ')}
                          </Typography>
                          {(stop.appointmentDate ?? stop.appointmentTime) && (
                            <Typography variant="caption" color="text.disabled">
                              {[stop.appointmentDate, stop.appointmentTime]
                                .filter(Boolean)
                                .join(' ')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                </Stack>
              </MainCard>

              {/* Broker Info */}
              <MainCard sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                  Broker Info
                </Typography>
                <InfoRow label="Broker" value={load.broker?.companyName} />
                <InfoRow label="Broker Ref #" value={load.brokerRefNumber} />
                <InfoRow label="Shipper" value={load.shipper?.companyName} />
                <InfoRow label="Consignee" value={load.consignee?.companyName} />
              </MainCard>

              {/* Assignment */}
              <MainCard sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                    Assignment
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<EditIcon fontSize="small" />}
                    onClick={() => setActiveDrawer('assignment')}
                  >
                    Edit
                  </Button>
                </Stack>
                <InfoRow label="Carrier" value={load.carrier?.name} />
                <InfoRow
                  label="Driver"
                  value={
                    load.driver
                      ? `${load.driver.firstName} ${load.driver.lastName}`
                      : null
                  }
                />
                <InfoRow
                  label="Vehicle"
                  value={
                    load.vehicle
                      ? `${load.vehicle.unitNumber} - ${load.vehicle.type}`
                      : null
                  }
                />
                <InfoRow label="Team Driver" value={load.isTeamDriver ? 'Yes' : 'No'} />
              </MainCard>

              {/* Cargo */}
              <MainCard sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                    Cargo
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<EditIcon fontSize="small" />}
                    onClick={() => setActiveDrawer('cargo')}
                  >
                    Edit
                  </Button>
                </Stack>
                <InfoRow label="Equipment" value={load.equipmentType} />
                <InfoRow label="Commodity" value={load.commodity} />
                <InfoRow label="Weight" value={load.weight ? `${load.weight.toLocaleString()} lbs` : null} />
                <InfoRow label="Pieces" value={load.pieceCount} />
                <InfoRow label="Hazmat" value={load.isHazmat ? 'Yes' : 'No'} />
                <InfoRow label="Tarp" value={load.isTarp ? 'Yes' : 'No'} />
              </MainCard>

              {/* BOL Workflow */}
              <MainCard sx={{ mb: 2 }}>
                <BolWorkflow
                  loadId={load.id}
                  loadStatus={load.status}
                  bolUnsignedAt={load.bolUnsignedAt}
                  bolSignedAt={load.bolSignedAt}
                />
              </MainCard>

              {/* Rate Con Status */}
              <MainCard sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={SECTION_LABEL_SX}
                >
                  Rate Confirmation
                </Typography>
                <RateConStatus
                  loadId={load.id}
                  loadStatus={load.status}
                  rateConReceivedAt={load.rateConReceivedAt}
                />
              </MainCard>

              {/* Documents */}
              <MainCard sx={{ mb: 2 }}>
                <DocumentList loadId={load.id} />
              </MainCard>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} lg={4}>
              {/* Financials */}
              <MainCard sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                  Financials
                </Typography>
                <InfoRow
                  label="Customer Rate"
                  value={load.customerRate ? `$${Number(load.customerRate).toLocaleString()}` : null}
                />
                <InfoRow
                  label="Carrier Rate"
                  value={load.carrierRate ? `$${Number(load.carrierRate).toLocaleString()}` : null}
                />
                <InfoRow
                  label="Dispatch Fee"
                  value={load.dispatchFee ? `$${Number(load.dispatchFee).toLocaleString()}` : null}
                />
                <InfoRow
                  label="Partner Split"
                  value={load.partnerSplit ? `$${Number(load.partnerSplit).toLocaleString()}` : null}
                />
                <Divider sx={{ my: 1 }} />
                <InfoRow label="Total Miles" value={load.totalMiles?.toLocaleString()} />
                <InfoRow
                  label="Rate/Mile"
                  value={load.ratePerMile ? `$${Number(load.ratePerMile).toFixed(2)}` : null}
                />
              </MainCard>

              {/* Planned Backhaul (if data exists on the load) */}
              {(load as Record<string, unknown>).plannedBackhaul && (
                <PlannedBackhaulPanel
                  backhaul={
                    (load as Record<string, unknown>).plannedBackhaul as {
                      route: string;
                      rate: number | null;
                      brokerName: string | null;
                      pickupDate: string | null;
                      isActive: boolean;
                    }
                  }
                  loadDestinationCity={
                    load.stops
                      .filter((s) => s.type === 'DELIVERY')
                      .sort((a, b) => b.sequence - a.sequence)[0]?.city
                  }
                  loadDestinationState={
                    load.stops
                      .filter((s) => s.type === 'DELIVERY')
                      .sort((a, b) => b.sequence - a.sequence)[0]?.state
                  }
                />
              )}

              {/* Status Timeline */}
              <MainCard sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                  Status Timeline
                </Typography>
                <StatusTimeline history={load.statusHistory ?? []} />
              </MainCard>

              {/* Check Calls */}
              <MainCard sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                  Check Calls
                </Typography>
                <CheckCallsSection
                  checkCalls={load.checkCalls ?? []}
                  loadId={load.id}
                />
              </MainCard>

              {/* Notes */}
              <MainCard sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                  Notes
                </Typography>
                <InfoRow label="Dispatcher Notes" value={load.dispatcherNotes} />
                <InfoRow label="Driver Instructions" value={load.driverInstructions} />
              </MainCard>
            </Grid>
          </Grid>

          {/* Status Change Dialog */}
          {statusDialogTarget && (
            <StatusChangeDialog
              open={statusDialogOpen}
              onClose={handleCloseStatusDialog}
              loadId={load.id}
              loadNumber={load.loadNumber}
              currentStatus={load.status}
              targetStatus={statusDialogTarget}
            />
          )}

          {/* Edit Drawers */}
          {activeDrawer === 'route' && (
            <LoadRouteDrawer load={load} onClose={handleCloseDrawer} />
          )}
          {activeDrawer === 'cargo' && (
            <LoadCargoDrawer load={load} onClose={handleCloseDrawer} />
          )}
          {activeDrawer === 'assignment' && (
            <LoadAssignmentDrawer load={load} onClose={handleCloseDrawer} />
          )}
        </>
      )}
    </PageWrapper>
  );
};

export default LoadDetailPage;
