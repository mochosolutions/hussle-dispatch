import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Box, Stack } from '@mui/material';

import { useDispatch, useSelector } from 'store';
import PortalLayout from 'components/PortalLayout';
import PortalFooter from 'components/PortalFooter';
import { Body, EntityId, Meta, SectionTitle } from 'components/Typography';
import type { DriverPortalLoad } from 'utils/api/driver-portal/driverPortalApi';
import {
  CLOSED_STATUSES,
  COMPLETED_STATUSES,
  DOC_UPLOAD_STATUSES,
  NEXT_STATUS,
  NEXT_STATUS_BUTTON_LABELS,
  STATUS_LABELS,
  DELIVERY_SEQUENCE,
} from '../../loadStatus';
import {
  clearDriverPortalError,
  fetchDriverPortalLoadFailure,
  fetchDriverPortalLoadRequest,
  updateDriverStatusRequest,
} from '../../store/reducers/driverPortalPageSlice';
import {
  selectDriverPortalLoad,
  selectDriverPortalCurrentLoadId,
  selectDriverPortalStatus,
  selectDriverPortalStatusUpdating,
  selectDriverPortalError,
} from '../../store/selectors/driverPortalSelectors';
import { DriverLocationButton } from '../../components/DriverLocationButton';
import { LoadStatusBadge } from '../../components/DriverPortalPage/LoadStatusBadge';
import { DeliveryProgress } from '../../components/DriverPortalPage/DeliveryProgress';
import { CurrentStageCard } from '../../components/DriverPortalPage/CurrentStageCard';
import { StopsCard } from '../../components/DriverPortalPage/StopsCard';
import { LoadInfoCard } from '../../components/DriverPortalPage/LoadInfoCard';
import { CheckInCard } from '../../components/DriverPortalPage/CheckInCard';
import { DocumentsChecklistCard } from '../../components/DriverPortalPage/DocumentsChecklistCard';
import { CompletedState } from '../../components/DriverPortalPage/CompletedState';
import { ErrorLayout, LoadingSkeleton } from '../../components/DriverPortalPage/PortalStates';

const buildRouteSummary = (load: DriverPortalLoad): string | null => {
  const stops = load.stops;
  if (stops.length === 0) {
    return null;
  }
  const first = stops[0];
  const last = stops[stops.length - 1];
  const place = (stop: { city: string | null; state: string | null }): string =>
    [stop.city, stop.state].filter(Boolean).join(', ');
  const origin = place(first);
  const destination = place(last);
  const route = origin && destination ? `${origin} → ${destination}` : origin || destination;
  return [route, `${stops.length} stops`].filter(Boolean).join(' · ');
};

const buildNextStopLabel = (load: DriverPortalLoad): string | undefined => {
  const wantPickup = ['DISPATCHED', 'EN_ROUTE_PICKUP', 'AT_PICKUP'].includes(load.status);
  const target = load.stops.find((stop) =>
    wantPickup ? stop.type === 'PICKUP' : stop.type === 'DELIVERY',
  );
  if (!target) {
    return undefined;
  }
  const fallback = [target.city, target.state].filter(Boolean).join(', ');
  return target.facilityName ?? (fallback || undefined);
};

const DriverPortalPage = () => {
  const params = useParams<{ loadId?: string }>();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // The portal now authorizes via the driver session cookie and takes the load
  // explicitly (route param or ?loadId=). The bare per-load token link is gone.
  const loadId = params.loadId ?? searchParams.get('loadId') ?? null;

  const currentLoadId = useSelector(selectDriverPortalCurrentLoadId);
  const load = useSelector(selectDriverPortalLoad(loadId));
  const portalStatus = useSelector(selectDriverPortalStatus);
  const statusUpdating = useSelector(selectDriverPortalStatusUpdating);
  const error = useSelector(selectDriverPortalError);

  useEffect(() => {
    if (loadId) {
      dispatch(fetchDriverPortalLoadRequest({ loadId }));
      return;
    }
    dispatch(fetchDriverPortalLoadFailure({ loadId: null, portalStatus: 'invalid' }));
  }, [dispatch, loadId]);

  const handleAdvanceStatus = () => {
    if (!loadId || !load) {
      return;
    }
    const nextStatus = NEXT_STATUS[load.status];
    if (!nextStatus) {
      return;
    }
    dispatch(updateDriverStatusRequest({ loadId, status: nextStatus }));
  };

  const handleRetry = () => {
    if (loadId) {
      dispatch(fetchDriverPortalLoadRequest({ loadId }));
    }
  };

  // Routes to the shared universal login, returning to this load afterwards.
  const handleSignIn = () => {
    const returnTo = loadId ? `/driver-portal/${loadId}` : '/driver-portal';
    navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

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
        title="Sign In Required"
        message="This link is not valid or your session has ended. Sign in to view your load, or contact your dispatcher."
        onSignIn={handleSignIn}
      />
    );
  }
  if (portalStatus === 'error') {
    return (
      <ErrorLayout
        title="Something Went Wrong"
        message="We couldn't load the page. Please try again."
        onRetry={handleRetry}
      />
    );
  }
  if (!load || !loadId || currentLoadId !== loadId) {
    return <LoadingSkeleton />;
  }

  const isClosed = CLOSED_STATUSES.has(load.status);
  const isCompleted = COMPLETED_STATUSES.has(load.status);

  // Read-only end state: load is invoiced/paid (or canceled). No actions.
  if (isCompleted || isClosed) {
    return (
      <PortalLayout
        brandSubtitle="Driver portal"
        contentMaxWidth={720}
        headerActions={<LoadStatusBadge loadNumber={load.loadNumber} status={load.status} />}
        stepper={<DeliveryProgress status={load.status} />}
      >
        <CompletedState load={load} closed={isClosed} />
        <PortalFooter />
      </PortalLayout>
    );
  }

  // Delivered but not yet invoiced: no status to advance, but the driver can
  // still upload remaining documents and send notes.
  const isDelivered = load.status === 'DELIVERED';
  const nextStatus = NEXT_STATUS[load.status];
  const routeSummary = buildRouteSummary(load);
  const stageIndex = DELIVERY_SEQUENCE.indexOf(load.status);
  const stageOf = `${(stageIndex >= 0 ? stageIndex : DELIVERY_SEQUENCE.length - 1) + 1}/${DELIVERY_SEQUENCE.length}`;

  return (
    <PortalLayout
      brandSubtitle="Driver portal"
      contentMaxWidth={720}
      headerActions={<LoadStatusBadge loadNumber={load.loadNumber} status={load.status} />}
      stepper={<DeliveryProgress status={load.status} />}
    >
      <Stack spacing={2}>
        <Box>
          <EntityId sx={{ display: { xs: 'block', sm: 'none' }, mb: 0.5 }}>
            {load.loadNumber}
          </EntityId>
          {load.driver && (
            <Meta sx={{ display: 'block', mb: 0.5 }}>Hi {load.driver.firstName},</Meta>
          )}
          <SectionTitle sx={{ fontSize: '1.5rem' }}>Here are your load details</SectionTitle>
          {routeSummary && <Body sx={{ color: 'text.secondary', mt: 0.5 }}>{routeSummary}</Body>}
        </Box>

        {error && (
          <Alert severity="error" onClose={() => dispatch(clearDriverPortalError())}>
            {error}
          </Alert>
        )}

        {!isDelivered && nextStatus && (
          <CurrentStageCard
            stageLabel={STATUS_LABELS[load.status] ?? load.status}
            stageOf={stageOf}
            nextStopLabel={buildNextStopLabel(load)}
            ctaLabel={NEXT_STATUS_BUTTON_LABELS[load.status] ?? 'Update Status'}
            onAdvance={handleAdvanceStatus}
            updating={statusUpdating}
          />
        )}

        {isDelivered && (
          <Alert severity="success">
            Delivered. Please upload any remaining documents and send a final note if needed.
          </Alert>
        )}

        {!isDelivered && <DriverLocationButton loadId={loadId} />}

        <CheckInCard loadId={loadId} />

        {DOC_UPLOAD_STATUSES.has(load.status) && (
          <DocumentsChecklistCard
            loadId={loadId}
            loadStatus={load.status}
            documents={load.documents}
          />
        )}

        <StopsCard stops={load.stops} />

        <LoadInfoCard load={load} />

        {load.driverInstructions && (
          <Alert severity="info" sx={{ whiteSpace: 'pre-wrap' }}>
            {load.driverInstructions}
          </Alert>
        )}
      </Stack>

      <PortalFooter />
    </PortalLayout>
  );
};

export default DriverPortalPage;
