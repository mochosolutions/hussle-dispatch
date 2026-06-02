import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, Chip, Stack } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useDispatch, useSelector } from 'store';
import PortalLayout from 'components/PortalLayout';
import PortalFooter from 'components/PortalFooter';
import { Body, BodyMuted, EntityId, SectionTitle } from 'components/Typography';
import type { DriverPortalLoad } from 'utils/api/driver-portal/driverPortalApi';
import { STATUS_COLORS, STATUS_LABELS } from '../../loadStatus';
import { fetchDriverPortalLoadsRequest } from '../../store/reducers/driverPortalPageSlice';
import {
  selectDriverPortalLoads,
  selectDriverPortalListStatus,
} from '../../store/selectors/driverPortalSelectors';
import { ErrorLayout, LoadingSkeleton } from '../../components/DriverPortalPage/PortalStates';

// Origin → destination · N stops summary for a load card.
const buildRouteSummary = (load: DriverPortalLoad): string | null => {
  const { stops } = load;
  if (stops.length === 0) {
    return null;
  }
  const place = (stop: { city: string | null; state: string | null }): string =>
    [stop.city, stop.state].filter(Boolean).join(', ');
  const origin = place(stops[0]);
  const destination = place(stops[stops.length - 1]);
  const route = origin && destination ? `${origin} → ${destination}` : origin || destination;
  return [route, `${stops.length} stops`].filter(Boolean).join(' · ');
};

const DriverPortalListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loads = useSelector(selectDriverPortalLoads);
  const listStatus = useSelector(selectDriverPortalListStatus);

  useEffect(() => {
    dispatch(fetchDriverPortalLoadsRequest());
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(fetchDriverPortalLoadsRequest());
  };

  // Routes to the shared universal login, returning to this list afterwards.
  const handleSignIn = () => {
    navigate(`/login?returnTo=${encodeURIComponent('/driver-portal')}`);
  };

  if (listStatus === 'loading') {
    return <LoadingSkeleton />;
  }
  if (listStatus === 'invalid') {
    return (
      <ErrorLayout
        title="Sign In Required"
        message="Your session has ended. Sign in to view your loads, or contact your dispatcher."
        onSignIn={handleSignIn}
      />
    );
  }
  if (listStatus === 'error') {
    return (
      <ErrorLayout
        title="Something Went Wrong"
        message="We couldn't load your loads. Please try again."
        onRetry={handleRetry}
      />
    );
  }

  return (
    <PortalLayout brandSubtitle="Driver portal" contentMaxWidth={720} footer={<PortalFooter />}>
      <Stack spacing={2}>
        <Box>
          <SectionTitle sx={{ fontSize: '1.5rem' }}>My Loads</SectionTitle>
          <Body sx={{ color: 'text.secondary', mt: 0.5 }}>
            Tap a load to view its details and update your status.
          </Body>
        </Box>

        {loads.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <BodyMuted>No loads assigned yet.</BodyMuted>
          </Card>
        ) : (
          loads.map((load) => (
            <Card key={load.id} variant="outlined">
              <CardActionArea
                onClick={() => navigate(`/driver-portal/${load.id}`)}
                sx={{ p: 2 }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <EntityId>{load.loadNumber}</EntityId>
                      <Chip
                        size="small"
                        color={STATUS_COLORS[load.status] ?? 'default'}
                        label={STATUS_LABELS[load.status] ?? load.status}
                      />
                    </Stack>
                    <BodyMuted>{buildRouteSummary(load) ?? 'No stops'}</BodyMuted>
                  </Box>
                  <ChevronRightIcon sx={{ color: 'text.disabled', flexShrink: 0 }} />
                </Stack>
              </CardActionArea>
            </Card>
          ))
        )}
      </Stack>
    </PortalLayout>
  );
};

export default DriverPortalListPage;
