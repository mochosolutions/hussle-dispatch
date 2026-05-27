import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Divider,
  Skeleton,
} from '@mui/material';
import { Body, BodyMuted, Meta, MetaStrong, SectionTitle, Timestamp } from 'components/Typography';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import type { DriverPortalLoad } from 'utils/api/driver-portal/driverPortalApi';
import formatPhone from 'utils/formatPhone';
import {
  getLoadSummary,
  advanceStatus,
  checkIn,
} from 'utils/api/driver-portal/driverPortalApi';
import type { ChipColor } from 'types/chipColor';
import { DocumentType } from 'features/documents/types';
import type { DriverPortalStatus } from '../../types';
import { PORTAL_GEOLOCATION_TIMEOUT_MS, PORTAL_SUCCESS_DISMISS_MS } from '../../constants';
import { PortalDocumentUpload } from '../../components/PortalDocumentUpload';
import { DriverLocationButton } from '../../components/DriverLocationButton';

// Status display names
const STATUS_LABELS: Record<string, string> = {
  DISPATCHED: 'Dispatched',
  EN_ROUTE_PICKUP: 'En Route to Pickup',
  AT_PICKUP: 'At Pickup',
  IN_TRANSIT: 'In Transit',
  AT_DELIVERY: 'At Delivery',
  DELIVERED: 'Delivered',
  INVOICE_PENDING: 'Delivered',
  INVOICED: 'Delivered',
  PAID: 'Delivered',
};

// Stop scheduling type display names
const SCHEDULING_TYPE_LABELS: Record<string, string> = {
  APPOINTMENT: 'Scheduled appointment',
  FCFS: 'First-come, first-served',
  NOTIFICATION: 'Notification required',
  OPEN: 'Open dock',
  DROP_HOOK: 'Drop & hook',
};

// Next status in the driver flow
const NEXT_STATUS: Record<string, string> = {
  DISPATCHED: 'EN_ROUTE_PICKUP',
  EN_ROUTE_PICKUP: 'AT_PICKUP',
  AT_PICKUP: 'IN_TRANSIT',
  IN_TRANSIT: 'AT_DELIVERY',
  AT_DELIVERY: 'DELIVERED',
};

const NEXT_STATUS_BUTTON_LABELS: Record<string, string> = {
  DISPATCHED: 'Start Route to Pickup',
  EN_ROUTE_PICKUP: 'Arrived at Pickup',
  AT_PICKUP: 'Loaded \u2014 Start Transit',
  IN_TRANSIT: 'Arrived at Delivery',
  AT_DELIVERY: 'Mark Delivered',
};

const STATUS_COLORS: Record<string, ChipColor> = {
  DISPATCHED: 'info',
  EN_ROUTE_PICKUP: 'info',
  AT_PICKUP: 'warning',
  IN_TRANSIT: 'primary',
  AT_DELIVERY: 'warning',
  DELIVERED: 'success',
};

const TERMINAL_STATUSES = new Set([
  'DELIVERED',
  'INVOICE_PENDING',
  'INVOICED',
  'PAID',
  'CANCELED',
  'TONU',
]);

const isTerminalStatus = (status: string): boolean => TERMINAL_STATUSES.has(status);

const DOC_UPLOAD_STATUSES = new Set(['AT_PICKUP', 'IN_TRANSIT', 'AT_DELIVERY', 'DELIVERED']);
const POD_UPLOAD_STATUSES = new Set(['AT_DELIVERY', 'DELIVERED']);

// Utility to capture GPS
const captureLocation = (): Promise<{ latitude: number; longitude: number } | null> =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { timeout: PORTAL_GEOLOCATION_TIMEOUT_MS, enableHighAccuracy: false },
    );
  });

// Format ISO timestamp to "Apr 26, 4:00 PM" (matches dispatcher view).
const formatAppointment = (iso: string): string => format(parseISO(iso), 'MMM d, h:mm a');

const formatAppointmentRange = (
  start: string | null,
  end: string | null,
): string | null => {
  if (start === null) {
    return null;
  }
  if (end === null) {
    return formatAppointment(start);
  }
  return `${formatAppointment(start)} – ${format(parseISO(end), 'h:mm a')}`;
};


// Axios error type guard
interface AxiosLikeError {
  response?: {
    status: number;
    data?: {
      errors?: { message: string }[];
    };
  };
}

const isAxiosError = (err: unknown): err is AxiosLikeError =>
  typeof err === 'object' && err !== null && 'response' in err;

// FE-003: Error layout component
interface ErrorLayoutProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

const ErrorLayout: React.FC<ErrorLayoutProps> = ({ title, message, onRetry }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
    <Box sx={{ maxWidth: { xs: 480, md: 720 }, mx: 'auto', px: 3, py: 8, textAlign: 'center' }}>
      <LocalShippingIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <SectionTitle sx={{ fontSize: '1.5rem', mb: 1 }}>{title}</SectionTitle>
      <BodyMuted sx={{ mb: 3 }}>{message}</BodyMuted>
      {onRetry && (
        <Button variant="contained" onClick={onRetry} sx={{ py: 1.5, px: 4 }}>
          Try Again
        </Button>
      )}
    </Box>
  </Box>
);

// FE-003: Loading skeleton
const LoadingSkeleton: React.FC = () => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
    <Box sx={{ maxWidth: { xs: 480, md: 720 }, mx: 'auto', px: 2, py: 3 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width={140} />
        <Skeleton variant="rounded" width={80} height={24} />
      </Stack>
      <Skeleton variant="rounded" height={56} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={160} />
    </Box>
  </Box>
);

const DriverPortalPage = () => {
  const { token } = useParams<{ token: string }>();
  const [load, setLoad] = useState<DriverPortalLoad | null>(null);
  const [portalStatus, setPortalStatus] = useState<DriverPortalStatus>('loading');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkInAbortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
      if (checkInAbortRef.current !== null) {
        checkInAbortRef.current.abort();
      }
    },
    [],
  );

  const fetchLoad = useCallback(async () => {
    if (!token) {
      setPortalStatus('invalid');
      return;
    }

    try {
      const data = await getLoadSummary(token);
      setLoad(data);
      setPortalStatus(isTerminalStatus(data.status) ? 'delivered' : 'ready');
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 401) {
        const message = err.response?.data?.errors?.[0]?.message ?? '';
        if (message.includes('expired')) {
          setPortalStatus('expired');
        } else if (message.includes('revoked')) {
          setPortalStatus('revoked');
        } else {
          setPortalStatus('invalid');
        }
      } else {
        setPortalStatus('error');
      }
    }
  }, [token]);

  useEffect(() => {
    fetchLoad();
  }, [fetchLoad]);

  const handleAdvanceStatus = async () => {
    if (!token || !load) {
      return;
    }
    const nextStatus = NEXT_STATUS[load.status];
    if (!nextStatus) {
      return;
    }

    setStatusUpdating(true);
    setError(null);

    try {
      // Auto-capture GPS on status transition
      const coords = await captureLocation();
      if (coords) {
        await checkIn(token, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          status: nextStatus,
        });
      }

      await advanceStatus(token, nextStatus);
      await fetchLoad();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCheckIn = async () => {
    if (!token || !notes.trim()) {
      return;
    }

    if (checkInAbortRef.current !== null) {
      checkInAbortRef.current.abort();
    }
    const controller = new AbortController();
    checkInAbortRef.current = controller;

    setCheckInSubmitting(true);
    setCheckInSuccess(false);
    if (successTimerRef.current !== null) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }

    try {
      const coords = await captureLocation();
      if (controller.signal.aborted) {
        return;
      }
      await checkIn(
        token,
        {
          notes: notes.trim(),
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        },
        controller.signal,
      );
      if (controller.signal.aborted) {
        return;
      }
      setNotes('');
      setCheckInSuccess(true);
      successTimerRef.current = setTimeout(() => {
        setCheckInSuccess(false);
        successTimerRef.current = null;
      }, PORTAL_SUCCESS_DISMISS_MS);
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        return;
      }
      if (isAxiosError(err) && err.response?.data?.errors?.[0]?.message) {
        setError(err.response.data.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit note');
      }
    } finally {
      if (checkInAbortRef.current === controller) {
        checkInAbortRef.current = null;
      }
      setCheckInSubmitting(false);
    }
  };

  // -- Error/loading states (FE-003) --

  if (portalStatus === 'loading') {
    return <LoadingSkeleton />;
  }

  if (portalStatus === 'expired') {
    return (
      <ErrorLayout
        title="Link Expired"
        message="This driver portal link has expired. Please contact your dispatcher for a new link."
      />
    );
  }

  if (portalStatus === 'revoked') {
    return (
      <ErrorLayout
        title="Link Revoked"
        message="This driver portal link is no longer active. Please contact your dispatcher."
      />
    );
  }

  if (portalStatus === 'invalid') {
    return (
      <ErrorLayout
        title="Invalid Link"
        message="This link is not valid. Please check the link or contact your dispatcher."
      />
    );
  }

  if (portalStatus === 'error') {
    return (
      <ErrorLayout
        title="Something Went Wrong"
        message="We couldn't load the page. Please try again."
        onRetry={fetchLoad}
      />
    );
  }

  if (!load) {
    return null;
  }

  const nextStatus = NEXT_STATUS[load.status];
  const showDocUpload = DOC_UPLOAD_STATUSES.has(load.status);
  const showBolUpload = DOC_UPLOAD_STATUSES.has(load.status);
  const showPodUpload = POD_UPLOAD_STATUSES.has(load.status);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Box sx={{ maxWidth: { xs: 480, md: 720 }, mx: 'auto', px: 2, py: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <LocalShippingIcon color="primary" />
        <SectionTitle>Load {load.loadNumber}</SectionTitle>
        <Chip
          label={STATUS_LABELS[load.status] ?? load.status}
          color={STATUS_COLORS[load.status] ?? 'default'}
          size="small"
        />
      </Stack>

      {/* Driver greeting */}
      {load.driver && (
        <Meta sx={{ mb: 2 }}>
          Hi {load.driver.firstName}, here are your load details.
        </Meta>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Status action button */}
      {nextStatus && portalStatus !== 'delivered' && (
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleAdvanceStatus}
          disabled={statusUpdating}
          sx={{ mb: 3, py: 2, fontSize: '1.1rem', fontWeight: 600 }}
        >
          {statusUpdating ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            NEXT_STATUS_BUTTON_LABELS[load.status]
          )}
        </Button>
      )}

      {portalStatus === 'delivered' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          This load has been delivered. Thank you!
        </Alert>
      )}

      {/* Stops timeline */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <MetaStrong sx={{ mb: 1.5, display: 'block' }}>Stops</MetaStrong>
          <Stack spacing={2}>
            {load.stops.map((stop) => (
              <Box key={stop.id}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <LocationOnIcon
                    sx={{
                      color: stop.type === 'PICKUP' ? 'primary.main' : 'success.main',
                      mt: 0.3,
                    }}
                    fontSize="small"
                  />
                  <Box>
                    <MetaStrong sx={{ color: 'text.primary' }}>
                      {stop.type === 'PICKUP' ? 'Pickup' : 'Delivery'}
                      {stop.facilityName ? ` \u2014 ${stop.facilityName}` : ''}
                    </MetaStrong>
                    {stop.address && <Meta>{stop.address}</Meta>}
                    <Meta>
                      {[stop.city, stop.state, stop.zip].filter(Boolean).join(', ')}
                    </Meta>
                    {(() => {
                      const range = formatAppointmentRange(
                        stop.appointmentStart,
                        stop.appointmentEnd,
                      );
                      return range ? <Meta>Appt: {range}</Meta> : null;
                    })()}
                    <Meta sx={{ display: 'block' }}>
                      {SCHEDULING_TYPE_LABELS[stop.schedulingType] ?? stop.schedulingType}
                    </Meta>
                    {stop.contactName && (
                      <Meta sx={{ display: 'block' }}>
                        Contact: {stop.contactName}
                        {stop.contactPhone ? ` \u2014 ${formatPhone(stop.contactPhone)}` : ''}
                      </Meta>
                    )}
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Load info */}
      {(load.equipmentType || load.commodity || load.weight) && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <MetaStrong sx={{ mb: 1, display: 'block' }}>Load Info</MetaStrong>
            <Stack spacing={0.5}>
              {load.equipmentType && (
                <Body>
                  Equipment: {load.equipmentType.replace(/_/g, ' ')}
                </Body>
              )}
              {load.commodity && <Body>Commodity: {load.commodity}</Body>}
              {load.weight && (
                <Body>
                  Weight: {load.weight.toLocaleString()} lbs
                </Body>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Driver instructions */}
      {load.driverInstructions && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <MetaStrong sx={{ mb: 1, display: 'block' }}>Instructions</MetaStrong>
            <Body sx={{ whiteSpace: 'pre-wrap' }}>
              {load.driverInstructions}
            </Body>
          </CardContent>
        </Card>
      )}

      {/* Location sharing (FE-002) */}
      {portalStatus !== 'delivered' && token && <DriverLocationButton token={token} />}

      {/* Notes / Check-in form */}
      {portalStatus !== 'delivered' && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <NoteAddIcon fontSize="small" color="action" />
              <MetaStrong>Add Note / ETA Update</MetaStrong>
            </Stack>
            <TextField
              multiline
              rows={3}
              fullWidth
              placeholder="Enter notes or ETA update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              size="small"
              inputProps={{ maxLength: 2000 }}
              helperText={`${notes.length}/2000`}
              sx={{ mb: 1.5 }}
            />
            <Button
              variant="outlined"
              fullWidth
              onClick={handleCheckIn}
              disabled={checkInSubmitting || !notes.trim()}
              sx={{ py: 1.2 }}
            >
              {checkInSubmitting ? <CircularProgress size={20} /> : 'Submit Note'}
            </Button>
            {checkInSuccess && (
              <Alert
                severity="success"
                sx={{ mt: 1 }}
                onClose={() => {
                  if (successTimerRef.current !== null) {
                    clearTimeout(successTimerRef.current);
                    successTimerRef.current = null;
                  }
                  setCheckInSuccess(false);
                }}
              >
                Note submitted
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document uploads (FE-002) */}
      {showDocUpload && token && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <MetaStrong sx={{ mb: 1.5, display: 'block' }}>Document Upload</MetaStrong>
            {showBolUpload && (
              <PortalDocumentUpload
                token={token}
                documentType={DocumentType.BOL_SIGNED}
                label="Bill of Lading (BOL)"
                sx={{ mb: showPodUpload ? 2 : 0 }}
              />
            )}
            {showPodUpload && (
              <>
                {showBolUpload && <Divider sx={{ my: 2 }} />}
                <PortalDocumentUpload
                  token={token}
                  documentType={DocumentType.POD}
                  label="Proof of Delivery (POD)"
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <Timestamp sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
        Powered by Hussle Dispatch
      </Timestamp>
      </Box>
    </Box>
  );
};

export default DriverPortalPage;
